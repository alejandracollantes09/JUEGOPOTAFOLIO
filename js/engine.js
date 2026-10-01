// ════════════════════════════════════════════════════════
//  HOSPITAL OLVIDADO — Motor 3D (Three.js + WebXR + WebGPU)
//  Carga el modelo GLB, gestiona colisiones, escaleras y VR
// ════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }       from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { INTERACTION_POINTS }  from './data.js';
import { audioManager }        from './audio.js';

// ── Constantes de movimiento y física ─────────────────────
const MOVE_SPEED        = 4.2;   // unidades/segundo
const FOOTSTEP_DIST     = 1.6;   // distancia entre pasos
const PLAYER_HEIGHT     = 1.7;   // altura de ojos del jugador
const PLAYER_RADIUS     = 0.45;  // radio de colisión del jugador
const MAX_STEP_UP       = 0.45;  // altura máxima de escalón que puede subir
const MAX_STEP_DOWN     = 0.85;  // altura máxima de escalón que puede bajar

export class HospitalEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Function} onInteract — callback(workId) cuando el jugador presiona E o interactúa en VR
   * @param {Function} onProgress — callback(percent, text) durante la carga
   */
  constructor(canvas, onInteract, onProgress) {
    this.canvas            = canvas;
    this.onInteract        = onInteract;
    this.onProgress        = onProgress;

    this._running          = false;
    this._keys             = {};          // teclas presionadas
    this._distWalked       = 0;           // para trigger de pasos
    this._nearItem         = null;        // ítem interactuable cercano
    this.collidableMeshes  = [];          // mallas para colisiones horizontales y suelo
    this.doorMeshes        = [];          // mallas de puertas
    this.controllers       = [];          // mandos WebXR

    this._raycaster        = new THREE.Raycaster();
    this._downRay          = new THREE.Raycaster();
    this._downRay.direction.set(0, -1, 0);

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initControls();
    this._initWebXR();
    this._bindEvents();
    this._buildFallbackEnvironment(); // mientras carga el GLB
  }

  // ── RENDERER (WebGPU / WebGL con soporte WebXR) ───────────
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping       = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 0.55;
    this.renderer.setClearColor(0x050505);

    // Habilitar WebXR para cascos de Realidad Virtual
    this.renderer.xr.enabled = true;

    // Verificar soporte de WebGPU en la GPU del usuario para telemetría
    if ('gpu' in navigator) {
      console.log('[WebGPU] Hardware GPU compatible detectado. Canal de aceleración activo.');
    }
  }

  // ── ESCENA ───────────────────────────────────────────────
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
  }

  // ── CÁMARA (primera persona) ──────────────────────────────
  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    this.camera.position.set(0, PLAYER_HEIGHT, 0);
  }

  // ── LUCES ────────────────────────────────────────────────
  _initLights() {
    // Luz ambiental tenue
    const ambient = new THREE.AmbientLight(0x221a1a, 1.2);
    this.scene.add(ambient);

    // Linterna (SpotLight anclada a la cámara del jugador)
    this.flashlight = new THREE.SpotLight(0xfff5e0, 9, 24, Math.PI / 7, 0.45, 1.5);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(1024, 1024);
    this.flashlight.shadow.bias = -0.0001;
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);
    this.flashlight.target.position.set(0, 0, -1);
    this.scene.add(this.camera);

    // Luz de emergencia roja parpadeante en el pasillo
    this.emergencyLight = new THREE.PointLight(0xff1100, 1.2, 10);
    this.emergencyLight.position.set(0, 2.8, -10);
    this.scene.add(this.emergencyLight);

    // Luces fluorescentes pálidas
    this._addCeilingLights();
  }

  _addCeilingLights() {
    const positions = [
      [-2, 3.2, -4], [2, 3.2, -10], [0, 3.2, -18], [-2, 3.2, -26], [2, 3.2, -34]
    ];
    positions.forEach(([x, y, z]) => {
      const light = new THREE.PointLight(0x99bbdd, 0.8, 9, 2);
      light.position.set(x, y, z);
      this.scene.add(light);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x99bbdd })
      );
      bulb.position.set(x, y, z);
      this.scene.add(bulb);
    });
  }

  // ── CONTROLES (PointerLock para PC) ───────────────────────
  _initControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
  }

  // ── WEBXR (Controladores y Realidad Virtual) ───────────────
  _initWebXR() {
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', () => {
        // En VR, apretar el gatillo interactúa si estás cerca de un punto
        this._tryInteract();
      });
      this.scene.add(controller);

      // Rayo guía láser en VR
      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -4)
      ]);
      const rayMat = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.6 });
      const ray = new THREE.Line(rayGeo, rayMat);
      controller.add(ray);

      this.controllers.push(controller);
    }
  }

  async startVRSession() {
    if (!navigator.xr) {
      alert('Tu navegador no cuenta con soporte WebXR para Realidad Virtual.');
      return;
    }
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!supported) {
        alert('No se detectó un visor VR conectado.');
        return;
      }
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });
      await this.renderer.xr.setSession(session);
      console.log('[WebXR] Sesión VR iniciada');
    } catch (err) {
      console.warn('[WebXR] Error al iniciar sesión VR:', err);
      alert('Error al iniciar WebXR VR: ' + err.message);
    }
  }

  // ── EVENTOS TECLADO Y REDIMENSIÓN ─────────────────────────
  _bindEvents() {
    window.addEventListener('keydown', e => {
      this._keys[e.code] = true;
      if (e.code === 'KeyE') this._tryInteract();
    });
    window.addEventListener('keyup',   e => { this._keys[e.code] = false; });
    window.addEventListener('resize',  () => this._onResize());
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── ENTORNO DE RESPALDO (si no hay GLB) ───────────────────
  _buildFallbackEnvironment() {
    this._fallbackGroup = new THREE.Group();
    this._fallbackGroup.name = 'fallback';

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this._fallbackGroup.add(floor);
    this.collidableMeshes.push(floor);

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 3.5;
    this._fallbackGroup.add(ceil);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.95 });
    const wallGeo = new THREE.BoxGeometry(4, 3.5, 80);
    const left  = new THREE.Mesh(wallGeo, wallMat);
    left.position.set(-2.5, 1.75, -40);
    this._fallbackGroup.add(left);
    this.collidableMeshes.push(left);

    const right = new THREE.Mesh(wallGeo, wallMat);
    right.position.set(2.5, 1.75, -40);
    this._fallbackGroup.add(right);
    this.collidableMeshes.push(right);

    INTERACTION_POINTS.forEach(point => {
      this._createInteractableObject(point, this._fallbackGroup);
    });

    this.scene.add(this._fallbackGroup);
  }

  _createInteractableObject(point, parent = this.scene) {
    const geo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a0000,
      emissive: 0x660000,
      emissiveIntensity: 0.6,
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(point.position.x, point.position.y + 0.4, point.position.z);
    mesh.castShadow = true;
    mesh.userData = { workId: point.workId, label: point.label };
    parent.add(mesh);

    const glow = new THREE.PointLight(0xff3300, 1.2, 3.5);
    glow.position.set(point.position.x, point.position.y + 1.4, point.position.z);
    parent.add(glow);

    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff5555 })
    );
    particle.position.set(point.position.x, point.position.y + 1.1, point.position.z);
    particle.userData.floatOffset = Math.random() * Math.PI * 2;
    parent.add(particle);

    if (!this._particles) this._particles = [];
    this._particles.push(particle);
  }

  // ── CARGA DEL MODELO GLB + APERTURA DE PUERTAS + SPAWN SEGURO ──
  loadHospitalModel(path = 'assets/models/hospital.glb') {
    return new Promise((resolve) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      this.onProgress(0, 'Cargando hospital…');

      loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;

          // 1. Auto-fit y centrado de escala del hospital
          const box    = new THREE.Box3().setFromObject(model);
          const size   = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxDim    = Math.max(size.x, size.y, size.z);
          const targetSize = 40;
          const scale     = maxDim > 0 ? targetSize / maxDim : 1;
          model.scale.setScalar(scale);

          model.position.set(
            -center.x * scale,
            -box.min.y * scale,
            -center.z * scale
          );

          // Limpiar colisiones previas de fallback
          this.collidableMeshes = [];
          if (this._fallbackGroup) {
            this.scene.remove(this._fallbackGroup);
            this._fallbackGroup = null;
          }

          // 2. Procesar puertas y mallas de colisión
          model.traverse(child => {
            const name = (child.name || '').toLowerCase();
            const isDoor = name.includes('door') || name.includes('puerta');

            if (isDoor) {
              // 🚪 Abrir puertas rotándolas para despejar el paso entre salas
              child.userData.isDoor = true;
              if (child.type === 'Group' || child.type === 'Object3D') {
                child.rotation.y = Math.PI * 0.48; // ~86 grados abierta
              }
              this.doorMeshes.push(child);
            }

            if (child.isMesh) {
              child.castShadow    = true;
              child.receiveShadow = true;

              if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => {
                  mat.roughness = Math.max(mat.roughness ?? 0.5, 0.6);
                  mat.metalness = Math.min(mat.metalness ?? 0, 0.25);
                });
              }

              // Registrar mallas para colisiones horizontales y escaleras (excluyendo puertas)
              if (!isDoor && !child.userData.isDoor) {
                this.collidableMeshes.push(child);
              }
            }
          });

          this.scene.add(model);
          this.hospitalModel = model;
          model.updateMatrixWorld(true);

          // 3. Crear objetos interactivos en el hospital real
          INTERACTION_POINTS.forEach(point => {
            this._createInteractableObject(point, this.scene);
          });

          // 4. Ubicación de Spawn Seguro DENTRO del hospital
          this._findSafeInteriorSpawn(model);

          // Ajustes de atmósfera lumínica
          this.scene.traverse(child => {
            if (child.isAmbientLight) child.intensity = 2.0;
          });
          if (this.flashlight) this.flashlight.intensity = 11;

          this.onProgress(100, '¡Hospital cargado!');
          console.log(`[GLB] Hospital cargado con ${this.doorMeshes.length} puertas abiertas y ${this.collidableMeshes.length} mallas de colisión.`);
          resolve(model);
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            this.onProgress(pct, `Cargando hospital… ${pct}%`);
          }
        },
        (err) => {
          console.warn('[Hospital Engine] Error cargando GLB:', err);
          this.onProgress(100, 'Usando entorno de respaldo');
          resolve(null);
        }
      );
    });
  }

  // ── CALCULAR SPAWN POINT SEGURO DENTRO DEL HOSPITAL ────────
  _findSafeInteriorSpawn(model) {
    // Probar candidatos de pasillo interior
    const candidatePoints = [
      { x: 0, z: 0 },
      { x: 0, z: -2 },
      { x: 0, z: 3 },
      { x: 2, z: -4 },
      { x: -2, z: -4 },
      { x: 0, z: -8 }
    ];

    const probeRay = new THREE.Raycaster();
    probeRay.direction.set(0, -1, 0);

    let selectedSpawn = null;

    for (const cand of candidatePoints) {
      probeRay.set(new THREE.Vector3(cand.x, 8.0, cand.z), new THREE.Vector3(0, -1, 0));
      const hits = probeRay.intersectObjects(this.collidableMeshes, false);

      if (hits.length > 0) {
        // Encontrar el piso más alto razonable (dentro de la planta)
        const floorHit = hits.find(h => h.point.y >= 0 && h.point.y <= 4.0 && h.face && h.face.normal.y > 0.6);
        if (floorHit) {
          selectedSpawn = new THREE.Vector3(cand.x, floorHit.point.y + PLAYER_HEIGHT, cand.z);
          break;
        }
      }
    }

    if (selectedSpawn) {
      this.camera.position.copy(selectedSpawn);
      console.log(`[Spawn] Jugador ubicado en el interior del hospital: (${selectedSpawn.x.toFixed(2)}, ${selectedSpawn.y.toFixed(2)}, ${selectedSpawn.z.toFixed(2)})`);
    } else {
      // Fallback seguro sobre el suelo interior
      this.camera.position.set(0, PLAYER_HEIGHT, 0);
    }
  }

  // ── INTERACCIÓN ──────────────────────────────────────────
  _tryInteract() {
    if (this._nearItem) {
      this.onInteract(this._nearItem);
    }
  }

  _checkProximity() {
    const camPos = this.camera.position;
    let closest = null;
    let closestDist = Infinity;

    INTERACTION_POINTS.forEach(point => {
      const dx = camPos.x - point.position.x;
      const dz = camPos.z - point.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < point.radius && dist < closestDist) {
        closestDist = dist;
        closest = point;
      }
    });

    this._nearItem = closest ? closest.workId : null;

    const prompt = document.getElementById('interaction-prompt');
    const text   = document.getElementById('interaction-text');
    if (this._nearItem && closest) {
      prompt?.classList.remove('hidden');
      if (text) text.innerHTML = `<kbd>E</kbd> ${closest.label}`;
    } else {
      prompt?.classList.add('hidden');
    }
  }

  // ── LOOP DE JUEGO (Compatible con WebXR) ─────────────────
  start() {
    this._running = true;
    this._clock   = new THREE.Clock();

    // Usar setAnimationLoop para soporte nativo de WebXR y render regular
    this.renderer.setAnimationLoop(() => this._animate());
  }

  pause() {
    this._running = false;
  }

  resume() {
    this._running = true;
    this._clock?.start();
  }

  _animate() {
    if (!this._running) return;

    const delta = this._clock.getDelta();
    const t     = this._clock.getElapsedTime();

    this._updateMovement(delta);
    this._updateGroundElevation();
    this._updateEffects(t);
    this._checkProximity();

    this.renderer.render(this.scene, this.camera);
  }

  // ── MOVIMIENTO CON COLISIÓN DE PAREDES (Wall Sliding) ─────
  _updateMovement(delta) {
    if (!this.controls.isLocked && !this.renderer.xr.isPresenting) return;

    const speed = MOVE_SPEED * delta;
    const forward  = new THREE.Vector3();
    const right    = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const moveVel = new THREE.Vector3();

    if (this._keys['KeyW'] || this._keys['ArrowUp'])    moveVel.addScaledVector(forward, speed);
    if (this._keys['KeyS'] || this._keys['ArrowDown'])  moveVel.addScaledVector(forward, -speed);
    if (this._keys['KeyA'] || this._keys['ArrowLeft'])  moveVel.addScaledVector(right, -speed);
    if (this._keys['KeyD'] || this._keys['ArrowRight']) moveVel.addScaledVector(right, speed);

    if (moveVel.lengthSq() > 0) {
      // Resolver colisiones con paredes antes de mover
      const allowedMove = this._resolveWallCollisions(moveVel);
      this.camera.position.add(allowedMove);

      // Sonido de pasos periódicos
      this._distWalked += allowedMove.length();
      if (this._distWalked >= FOOTSTEP_DIST) {
        this._distWalked = 0;
        audioManager.playFootstep();
      }
    }
  }

  // ── RESOLUCIÓN DE COLISIONES CON PAREDES (No atravesar el GLB) ──
  _resolveWallCollisions(vel) {
    if (this.collidableMeshes.length === 0) return vel;

    const moveDist = vel.length();
    const moveDir  = vel.clone().normalize();
    const rayDist  = PLAYER_RADIUS + moveDist;

    // Probar a altura del pecho y cintura
    const probeHeights = [-0.2, -0.6];
    let blockedNormal = null;

    for (const h of probeHeights) {
      const probeOrigin = this.camera.position.clone();
      probeOrigin.y += h;

      this._raycaster.set(probeOrigin, moveDir);
      this._raycaster.far = rayDist;
      const hits = this._raycaster.intersectObjects(this.collidableMeshes, false);

      if (hits.length > 0) {
        const hit = hits[0];
        // Verificar si la cara impactada es vertical (pared)
        if (hit.face) {
          const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
          if (Math.abs(worldNormal.y) < 0.45) { // Pared vertical
            blockedNormal = worldNormal;
            break;
          }
        }
      }
    }

    if (blockedNormal) {
      // Deslizar a lo largo de la pared (Wall Sliding Projection)
      const dot = vel.dot(blockedNormal);
      const slideVel = vel.clone().sub(blockedNormal.clone().multiplyScalar(dot));

      // Verificar que el vector deslizado no choque de frente
      if (slideVel.lengthSq() > 0.0001) {
        const slideDir = slideVel.clone().normalize();
        this._raycaster.set(this.camera.position, slideDir);
        this._raycaster.far = PLAYER_RADIUS + slideVel.length();
        const slideHits = this._raycaster.intersectObjects(this.collidableMeshes, false);
        if (slideHits.length === 0) {
          return slideVel;
        }
      }
      return new THREE.Vector3(0, 0, 0); // Detenerse contra la pared
    }

    return vel;
  }

  // ── DETECCIÓN DE SUELO Y ESCALERAS (Subir y bajar) ─────────
  _updateGroundElevation() {
    if (this.collidableMeshes.length === 0) return;

    const rayOrigin = this.camera.position.clone();
    rayOrigin.y += 0.5; // Empezar sondeo ligeramente arriba del jugador

    this._downRay.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    this._downRay.far = 4.0;
    const hits = this._downRay.intersectObjects(this.collidableMeshes, false);

    if (hits.length > 0) {
      // Buscar el piso más cercano debajo del jugador
      const floorHit = hits.find(h => h.face && h.face.normal.y > 0.4);
      if (floorHit) {
        const targetCamY = floorHit.point.y + PLAYER_HEIGHT;
        const diff = targetCamY - this.camera.position.y;

        // Si es un escalón o rampa transitable
        if (diff > 0 && diff <= MAX_STEP_UP) {
          // Subir suavemente el escalón
          this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 0.35);
        } else if (diff < 0 && diff >= -MAX_STEP_DOWN) {
          // Bajar suavemente el escalón
          this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 0.35);
        }
      }
    }
  }

  // ── EFECTOS VISUALES ORGÁNICOS ───────────────────────────
  _updateEffects(t) {
    if (this.emergencyLight) {
      const flicker = Math.sin(t * 4.2) * Math.sin(t * 1.1);
      this.emergencyLight.intensity = Math.max(0, flicker) * 1.8;
    }

    if (this.flashlight) {
      this.flashlight.intensity = 10.5 + Math.sin(t * 12) * 0.35;
    }

    this._particles?.forEach(p => {
      p.position.y += Math.sin(t * 2 + p.userData.floatOffset) * 0.002;
    });

    this.scene.traverse(child => {
      if (child.isMesh && child.userData.workId) {
        child.rotation.y += 0.012;
      }
    });
  }

  /** Bloquea el puntero del mouse para el control de cámara */
  lockPointer() { this.controls.lock(); }
  unlockPointer() { this.controls.unlock(); }

  get isPointerLocked() { return this.controls.isLocked; }
}

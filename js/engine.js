// ════════════════════════════════════════════════════════
//  HOSPITAL OLVIDADO — Motor 3D (Three.js)
//  Carga el modelo GLB del hospital y gestiona el movimiento
// ════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }       from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { INTERACTION_POINTS }  from './data.js';
import { audioManager }        from './audio.js';

// ── Constantes de movimiento ──────────────────────────────
const MOVE_SPEED      = 4.5;   // unidades/segundo
const FOOTSTEP_DIST   = 1.5;   // distancia entre pasos (unidades)
const PLAYER_HEIGHT   = 1.7;   // altura de la cámara en Y
const FOG_NEAR        = 1;
const FOG_FAR         = 25;

export class HospitalEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Function} onInteract — callback(workId) cuando el jugador presiona E
   * @param {Function} onProgress — callback(percent, text) durante la carga
   */
  constructor(canvas, onInteract, onProgress) {
    this.canvas      = canvas;
    this.onInteract  = onInteract;
    this.onProgress  = onProgress;

    this._running    = false;
    this._keys       = {};          // teclas presionadas
    this._distWalked = 0;           // para trigger de pasos
    this._nearItem   = null;        // ítem interactuable cercano

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initControls();
    this._bindEvents();
    this._buildFallbackEnvironment(); // mientras carga el GLB
  }

  // ── RENDERER ─────────────────────────────────────────────
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping       = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 0.4;
    // Fondo muy oscuro (niebla oscura)
    this.renderer.setClearColor(0x050505);
  }

  // ── ESCENA ───────────────────────────────────────────────
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x050505, FOG_NEAR, FOG_FAR);
    this.scene.background = new THREE.Color(0x050505);
  }

  // ── CÁMARA (primera persona) ──────────────────────────────
  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, PLAYER_HEIGHT, 0);
  }

  // ── LUCES ────────────────────────────────────────────────
  _initLights() {
    // Luz ambiental muy tenue (atmósfera de hospital)
    const ambient = new THREE.AmbientLight(0x1a0808, 0.8);
    this.scene.add(ambient);

    // Linterna (sigue a la cámara)
    this.flashlight = new THREE.SpotLight(0xfff5e0, 8, 20, Math.PI / 8, 0.4, 1.5);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(512, 512);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);
    this.flashlight.target.position.set(0, 0, -1);
    this.scene.add(this.camera);

    // Luz de emergencia roja parpadeante
    this.emergencyLight = new THREE.PointLight(0xff0000, 0, 8);
    this.emergencyLight.position.set(0, 3, -10);
    this.scene.add(this.emergencyLight);

    // Algunas luces de neón pálido en el techo
    this._addCeilingLights();
  }

  _addCeilingLights() {
    const positions = [
      [-2, 3, -5], [2, 3, -12], [0, 3, -20], [-3, 3, -28], [3, 3, -35]
    ];
    positions.forEach(([x, y, z]) => {
      const light = new THREE.PointLight(0x88aacc, 0.5, 10, 2);
      light.position.set(x, y, z);
      this.scene.add(light);

      // Objeto visual (bombilla)
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x88aacc })
      );
      bulb.position.set(x, y, z);
      this.scene.add(bulb);
    });
  }

  // ── CONTROLES (PointerLock) ────────────────────────────────
  _initControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
    // El lock se activa desde ui.js al iniciar el juego
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

    // Suelo
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this._fallbackGroup.add(floor);

    // Techo
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 3.5;
    this._fallbackGroup.add(ceil);

    // Paredes del pasillo
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.95 });
    const wallGeo = new THREE.BoxGeometry(4, 3.5, 80);
    const left  = new THREE.Mesh(wallGeo, wallMat);
    left.position.set(-2.5, 1.75, -40);
    this._fallbackGroup.add(left);
    const right = new THREE.Mesh(wallGeo, wallMat);
    right.position.set(2.5, 1.75, -40);
    this._fallbackGroup.add(right);

    // Objetos interactuables placeholder
    INTERACTION_POINTS.forEach(point => {
      this._createInteractableObject(point, this._fallbackGroup);
    });

    this.scene.add(this._fallbackGroup);
  }

  _createInteractableObject(point, parent = this.scene) {
    const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a0000, emissive: 0x550000, emissiveIntensity: 0.5, roughness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(point.position.x, point.position.y + 0.4, point.position.z);
    mesh.castShadow = true;
    mesh.userData = { workId: point.workId, label: point.label };
    parent.add(mesh);

    const glow = new THREE.PointLight(0xff2200, 1, 3);
    glow.position.set(point.position.x, point.position.y + 1.5, point.position.z);
    parent.add(glow);

    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4444 })
    );
    particle.position.set(point.position.x, point.position.y + 1.2, point.position.z);
    particle.userData.floatOffset = Math.random() * Math.PI * 2;
    parent.add(particle);

    if (!this._particles) this._particles = [];
    this._particles.push(particle);

  }

  // ── CARGA DEL MODELO GLB ─────────────────────────────────
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

          // ── Auto-fit: calcular tamaño real del modelo ──────────
          const box    = new THREE.Box3().setFromObject(model);
          const size   = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          console.log('[GLB] Tamaño real:', size);
          console.log('[GLB] Centro:', center);

          // Escalar para que la dimensión mayor sea ~40 unidades
          const maxDim    = Math.max(size.x, size.y, size.z);
          const targetSize = 40;
          const scale     = maxDim > 0 ? targetSize / maxDim : 1;
          model.scale.setScalar(scale);
          console.log('[GLB] Escala aplicada:', scale);

          // Centrar en X/Z, poner suelo en Y=0
          model.position.set(
            -center.x * scale,
            -box.min.y * scale,
            -center.z * scale
          );

          // ── Posicionar cámara fuera del modelo ──
          const worldBox = new THREE.Box3().setFromObject(model);
          // Spawn justo frente al modelo, a la altura del jugador
          this.camera.position.set(
            0,
            PLAYER_HEIGHT,
            worldBox.max.z + 3   // 3 unidades al frente de la fachada
          );

          // Sin niebla para ver bien el modelo al inicio
          this.scene.fog = null;

          // Sombras y materiales
          model.traverse(child => {
            if (child.isMesh) {
              child.castShadow    = true;
              child.receiveShadow = true;
              if (child.material) {
                const mats = Array.isArray(child.material)
                  ? child.material : [child.material];
                mats.forEach(mat => {
                  mat.roughness = Math.max(mat.roughness ?? 0.5, 0.6);
                  mat.metalness = Math.min(mat.metalness ?? 0, 0.3);
                });
              }
            }
          });

          this.scene.add(model);
          this.hospitalModel = model;

          // Eliminar entorno de respaldo — ya tenemos el modelo real
          if (this._fallbackGroup) {
            this.scene.remove(this._fallbackGroup);
            this._fallbackGroup = null;
          }

          // Aumentar luz ambiental para ver el modelo del hospital
          this.scene.traverse(child => {
            if (child.isAmbientLight) child.intensity = 2.5;
          });
          if (this.flashlight) this.flashlight.intensity = 12;

          this.onProgress(100, '¡Hospital cargado!');
          console.log('[GLB] Modelo cargado correctamente ✅');
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

    // Mostrar/ocultar el prompt de interacción
    const prompt = document.getElementById('interaction-prompt');
    const text   = document.getElementById('interaction-text');
    if (this._nearItem && closest) {
      prompt?.classList.remove('hidden');
      if (text) text.innerHTML = `<kbd>E</kbd> ${closest.label}`;
    } else {
      prompt?.classList.add('hidden');
    }
  }

  // ── LOOP DE JUEGO ────────────────────────────────────────
  start() {
    this._running = true;
    this._clock   = new THREE.Clock();
    this._animate();
  }

  pause() { this._running = false; }
  resume() {
    this._running = true;
    this._clock?.start();
    this._animate();
  }

  _animate() {
    if (!this._running) return;
    requestAnimationFrame(() => this._animate());

    const delta = this._clock.getDelta();
    const t     = this._clock.getElapsedTime();

    this._updateMovement(delta);
    this._updateEffects(t);
    this._checkProximity();

    this.renderer.render(this.scene, this.camera);
  }

  _updateMovement(delta) {
    if (!this.controls.isLocked) return;

    const speed = MOVE_SPEED * delta;
    let moved = false;

    // Dirección de movimiento relativa a la cámara
    const forward  = new THREE.Vector3();
    const right    = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const vel = new THREE.Vector3();

    if (this._keys['KeyW'] || this._keys['ArrowUp'])    vel.addScaledVector(forward, speed);
    if (this._keys['KeyS'] || this._keys['ArrowDown'])  vel.addScaledVector(forward, -speed);
    if (this._keys['KeyA'] || this._keys['ArrowLeft'])  vel.addScaledVector(right, -speed);
    if (this._keys['KeyD'] || this._keys['ArrowRight']) vel.addScaledVector(right, speed);

    if (vel.lengthSq() > 0) {
      this.camera.position.add(vel);
      // Mantener altura fija (sin física vertical por ahora)
      this.camera.position.y = PLAYER_HEIGHT;
      moved = true;

      // Sonido de pasos
      this._distWalked += vel.length();
      if (this._distWalked >= FOOTSTEP_DIST) {
        this._distWalked = 0;
        audioManager.playFootstep();
      }
    }
  }

  _updateEffects(t) {
    // Luz de emergencia parpadeante
    if (this.emergencyLight) {
      const flicker = Math.sin(t * 3.7) * Math.sin(t * 0.9);
      this.emergencyLight.intensity = Math.max(0, flicker) * 1.5;
    }

    // Fluctuación de la linterna (efecto de temblor)
    if (this.flashlight) {
      this.flashlight.intensity = 8 + Math.sin(t * 11) * 0.3;
    }

    // Partículas flotantes
    this._particles?.forEach(p => {
      p.position.y += Math.sin(t * 2 + p.userData.floatOffset) * 0.002;
    });

    // Animación de objetos interactivos (rotación lenta)
    this.scene.traverse(child => {
      if (child.isMesh && child.userData.workId) {
        child.rotation.y += 0.01;
      }
    });
  }

  /** Bloquea el puntero del mouse para el control de cámara */
  lockPointer() { this.controls.lock(); }
  unlockPointer() { this.controls.unlock(); }

  get isPointerLocked() { return this.controls.isLocked; }
}

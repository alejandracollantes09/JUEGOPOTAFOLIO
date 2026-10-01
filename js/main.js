// ════════════════════════════════════════════════════════
//  HOSPITAL OLVIDADO — Punto de entrada principal
// ════════════════════════════════════════════════════════

import { HospitalEngine } from './engine.js';
import { UIManager }      from './ui.js';
import { audioManager }   from './audio.js';

// ── Estado global ────────────────────────────────────────
let engine = null;
let ui     = null;
let gameStarted = false;

// ── Inicialización ───────────────────────────────────────
async function init() {
  const canvas = document.getElementById('game-canvas');

  // Crear UI (con callbacks)
  ui = new UIManager(startGame, restartGame);

  // Mostrar pantalla de inicio
  ui.showScreen('screen-intro');

  // ESC — pausa / despausa
  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && gameStarted) {
      if (engine?.isPointerLocked) {
        engine.unlockPointer();
        ui.openPause();
        engine.pause();
      } else {
        // Si hay modales abiertos, cerrarlos
        const riddleOpen    = !document.getElementById('modal-riddle')?.classList.contains('hidden');
        const portfolioOpen = !document.getElementById('modal-portfolio')?.classList.contains('hidden');
        const pauseOpen     = !document.getElementById('modal-pause')?.classList.contains('hidden');

        if (riddleOpen)    { ui.closeRiddle(); }
        if (portfolioOpen) { ui.closePortfolio(); }
        if (pauseOpen)     { ui.closePause(); engine.resume(); engine.lockPointer(); }
        if (!riddleOpen && !portfolioOpen && !pauseOpen) {
          engine.lockPointer();
        }
      }
    }
  });

  // Click en canvas para re-lockear el puntero
  canvas?.addEventListener('click', () => {
    if (gameStarted && !engine?.isPointerLocked) {
      const anyModalOpen = ['modal-riddle', 'modal-portfolio', 'modal-pause']
        .some(id => !document.getElementById(id)?.classList.contains('hidden'));
      if (!anyModalOpen) engine?.lockPointer();
    }
  });
}

// ── Iniciar juego ────────────────────────────────────────
async function startGame() {
  ui.showScreen('screen-loading');
  ui.setLoadingProgress(0, 'Inicializando motor…');

  const canvas = document.getElementById('game-canvas');

  // Crear el motor 3D
  engine = new HospitalEngine(
    canvas,
    // Callback: interacción con objeto
    (workId) => {
      const opened = ui.openRiddle(workId, engine);
      if (!opened) {
        // Ya desbloqueado — mostrar portafolio directamente
        ui.openPortfolio(workId);
        engine.unlockPointer();
      }
    },
    // Callback: progreso de carga
    (percent, text) => {
      ui.setLoadingProgress(percent, text);
    }
  );

  // Cargar el modelo del hospital
  ui.setLoadingProgress(10, 'Cargando hospital…');
  await engine.loadHospitalModel('assets/models/hospital.glb');

  ui.setLoadingProgress(100, '¡Listo!');
  await delay(600);

  // Mostrar pantalla de juego
  ui.showScreen('screen-game');
  engine.start();

  // Lockear el puntero tras un momento
  await delay(300);
  engine.lockPointer();
  gameStarted = true;
}

// ── Reiniciar juego ───────────────────────────────────────
async function restartGame() {
  gameStarted = false;
  engine?.pause();
  engine = null;
  ui.reset();
  await startGame();
}

// ── Utilidad ──────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Arrancar ──────────────────────────────────────────────
init();

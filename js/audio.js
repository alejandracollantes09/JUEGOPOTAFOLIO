// ════════════════════════════════════════════════════════
//  HOSPITAL OLVIDADO — Sistema de Audio
// ════════════════════════════════════════════════════════

/**
 * Gestiona todos los sonidos del juego.
 * Los archivos de audio van en assets/audio/
 * 
 * ARCHIVOS NECESARIOS (agrega tus propios o descárgalos libres de derechos):
 *  ambient.mp3        — Música de fondo de terror (loop)
 *  footstep1.mp3      — Paso 1 (sonido de paso en piso de hospital)
 *  footstep2.mp3      — Paso 2 (alternado con el anterior)
 *  key_pickup.mp3     — Sonido al recoger una llave
 *  door_unlock.mp3    — Sonido al abrir puerta con llave
 *  correct.mp3        — Acertijo correcto
 *  wrong.mp3          — Acertijo incorrecto
 *  win.mp3            — Fanfarria de victoria
 * 
 * FUENTES GRATUITAS recomendadas:
 *  - freesound.org (CC0 / Attribution)
 *  - mixkit.co
 *  - pixabay.com/sound-effects
 */

class AudioManager {
  constructor() {
    this.muted    = false;
    this.ambientVolume = 0.35;
    this.sfxVolume     = 0.7;
    this.footstepToggle = 0; // alterna entre footstep1 y footstep2

    // Referencias a elementos <audio> del DOM
    this.ambient        = document.getElementById('audio-ambient');
    this.footstep1      = document.getElementById('audio-footstep-1');
    this.footstep2      = document.getElementById('audio-footstep-2');
    this.sfxUnlock      = document.getElementById('audio-unlock');
    this.sfxKey         = document.getElementById('audio-key');
    this.sfxCorrect     = document.getElementById('audio-riddle-correct');
    this.sfxWrong       = document.getElementById('audio-riddle-wrong');
    this.sfxJumpscare   = document.getElementById('audio-jumpscare');

    this._setSources();
    this._configureVolumes();
  }

  _setSources() {
    // Intenta cargar cada archivo; si no existe, el elemento queda silencioso
    const trySet = (el, src) => {
      if (!el) return;
      el.src = src;
      el.load();
    };

    trySet(this.ambient,      'assets/audio/ambient.mp3');
    trySet(this.footstep1,    'assets/audio/footstep1.mp3');
    trySet(this.footstep2,    'assets/audio/footstep2.mp3');
    trySet(this.sfxUnlock,    'assets/audio/door_unlock.mp3');
    trySet(this.sfxKey,       'assets/audio/key_pickup.mp3');
    trySet(this.sfxCorrect,   'assets/audio/correct.mp3');
    trySet(this.sfxWrong,     'assets/audio/wrong.mp3');
    trySet(this.sfxJumpscare, 'assets/audio/jumpscare.mp3');
  }

  _configureVolumes() {
    if (this.ambient) {
      this.ambient.volume = this.ambientVolume;
      this.ambient.loop   = true;
    }
    [this.footstep1, this.footstep2, this.sfxUnlock,
     this.sfxKey, this.sfxCorrect, this.sfxWrong, this.sfxJumpscare]
      .forEach(el => { if (el) el.volume = this.sfxVolume; });
  }

  /** Inicia la música ambiental (debe llamarse desde interacción del usuario) */
  startAmbient() {
    if (!this.ambient || this.muted) return;
    this.ambient.play().catch(() => {}); // ignora error autoplay
  }

  /** Alterna mute global */
  toggleMute() {
    this.muted = !this.muted;
    if (this.ambient) {
      this.muted ? this.ambient.pause() : this.ambient.play().catch(() => {});
    }
    return this.muted;
  }

  /** Reproduce un paso de caminar (alterna L/R) */
  playFootstep() {
    if (this.muted) return;
    const step = this.footstepToggle % 2 === 0 ? this.footstep1 : this.footstep2;
    this.footstepToggle++;
    if (!step || !step.src) return;
    step.currentTime = 0;
    step.play().catch(() => {});
  }

  playSFX(name) {
    if (this.muted) return;
    const map = {
      key:       this.sfxKey,
      unlock:    this.sfxUnlock,
      correct:   this.sfxCorrect,
      wrong:     this.sfxWrong,
      jumpscare: this.sfxJumpscare,
    };
    const el = map[name];
    if (!el || !el.src) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();

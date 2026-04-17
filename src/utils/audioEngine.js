/**
 * Centralized Audio Engine for the Portfolio
 * Handles lazy loading, pitch shifting, and master volume control.
 */

const SOUND_FILES = {
  hover: "/assets/sounds/Hover sound.wav",
  click: "/assets/sounds/mouse-click.wav",
  toggle: "/assets/sounds/toggle sound.wav",
  drag: "/assets/sounds/mouse drag sound.wav", 
  background: "/assets/sounds/background music.mp3",
};

class AudioEngine {
  constructor() {
    this.state = 'ON'; // ON, OFF (Default is ON now)
    this.sounds = {
      hover: null,
      click: null,
      toggle: null,
      drag: null,
      background: null,
    };
    this.hasInteracted = false;
    this.isInitialized = false;
  }

  // Preload small UI sounds
  init() {
    if (this.isInitialized) return;
    
    this.sounds.hover = new Audio(SOUND_FILES.hover);
    this.sounds.click = new Audio(SOUND_FILES.click);
    this.sounds.toggle = new Audio(SOUND_FILES.toggle);
    this.sounds.drag = new Audio("/assets/sounds/mouse drag sound.wav"); // Loading the specific file
    
    this.isInitialized = true;
  }

  // Interaction trigger
  onFirstInteraction() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    
    // Lazy load background music
    this.sounds.background = new Audio(SOUND_FILES.background);
    this.sounds.background.loop = true;
    
    if (this.state === 'ON') {
      this.playBackground();
    }
  }

  setMuted(isMuted) {
    this.state = isMuted ? 'OFF' : 'ON';
    
    if (this.state === 'OFF') {
      this.sounds.background?.pause();
    } else {
      if (this.hasInteracted) {
        this.playBackground();
      }
    }
  }

  playBackground() {
    if (!this.sounds.background) return;
    const vol = 0.06; // reduced by 2% (from 8% to 6%)
    if (this.state === 'ON') {
      this.sounds.background.volume = vol;
      this.sounds.background.play().catch(() => {});
    } else {
      this.sounds.background.pause();
    }
  }

  playHover(pitchShift = true) {
    if (this.state === 'OFF' || !this.sounds.hover) return;
    const sound = this.sounds.hover.cloneNode();
    sound.volume = 0.10; // increased visibility (10%)
    if (pitchShift) sound.playbackRate = 0.95 + Math.random() * 0.1;
    sound.play().catch(() => {});
  }

  playDrag() {
    if (this.state === 'OFF' || !this.sounds.drag) return;
    const sound = this.sounds.drag.cloneNode();
    sound.volume = 0.12; // clearly felt (12%)
    sound.play().catch(() => {});
  }

  playClick() {
    if (this.state === 'OFF' || !this.sounds.click) return;
    const sound = this.sounds.click.cloneNode();
    sound.volume = 0.10; // match hover/drag priority (10%)
    sound.play().catch(() => {});
  }

  playToggle() {
    if (this.state === 'OFF' || !this.sounds.toggle) return;
    const sound = this.sounds.toggle.cloneNode();
    sound.volume = 0.07; // 7%
    sound.play().catch(() => {});
  }
}

const engine = new AudioEngine();
export default engine;

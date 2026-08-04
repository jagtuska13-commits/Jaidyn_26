// Web Audio API synthesized mechanical keyboard sound effect generator

let audioCtx: AudioContext | null = null;
let typingInterval: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a single synthesized mechanical key switch click sound
 */
export function playKeyClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. High frequency click noise burst (snap of switch actuation)
    const bufferSize = ctx.sampleRate * 0.015; // 15ms burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Bandpass filter for tactile click sound (2kHz - 5kHz)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2800 + Math.random() * 800, now); // randomized switch tone
    bandpass.Q.setValueAtTime(3.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noiseNode.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Low-frequency thud (keycap bottoming out on switch housing)
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(140 + Math.random() * 30, now);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.025);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.03, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);

    // Start & stop sound sources
    noiseNode.start(now);
    noiseNode.stop(now + 0.015);

    thudOsc.start(now);
    thudOsc.stop(now + 0.025);
  } catch (err) {
    // Ignore audio context errors if user hasn't interacted yet
  }
}

/**
 * Starts continuous typing click sounds at organic human/AI typing speed
 */
export function startMechanicalKeyboardLoop() {
  stopMechanicalKeyboardLoop();

  // Play initial click immediately
  playKeyClick();

  const scheduleNextClick = () => {
    // Organic typing cadence interval (between 50ms and 110ms)
    const randomDelay = Math.floor(Math.random() * 60) + 50;
    typingInterval = setTimeout(() => {
      playKeyClick();
      scheduleNextClick();
    }, randomDelay);
  };

  scheduleNextClick();
}

/**
 * Stops continuous mechanical typing sound loop
 */
export function stopMechanicalKeyboardLoop() {
  if (typingInterval) {
    clearTimeout(typingInterval);
    typingInterval = null;
  }
}

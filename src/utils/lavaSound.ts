// Web Audio API Ambient Lava Lamp Synthesizer - Warm 120Hz Ambient Sub-Bass & Liquid Bubbles

let audioCtx: AudioContext | null = null;
let noiseNode: AudioNode | null = null;
let bassOscNode: OscillatorNode | null = null;
let bassLfoNode: OscillatorNode | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let bubbleTimer: number | null = null;

// Initialize or resume Web Audio Context
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate relaxing low-frequency magma ambient rumble & 120Hz sub-bass resonance
function createMagmaRumbleNode(ctx: AudioContext): GainNode {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate pink/brown noise for warm deep texture
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  // Low-pass filter for soothing magma texture
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(130, ctx.currentTime);

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.setValueAtTime(0.06, ctx.currentTime);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(rumbleGain);
  noiseSource.start();
  noiseNode = noiseSource;

  // --- 120Hz Warm Organic Ambient Sub-Bass Oscillator ---
  const subBassOsc = ctx.createOscillator();
  subBassOsc.type = 'sine';
  subBassOsc.frequency.setValueAtTime(120, ctx.currentTime); // Precise 120 Hz Ambient Bass Core

  // Subtle 0.18 Hz LFO pitch wobble for organic realism
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.18, ctx.currentTime);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(2.5, ctx.currentTime); // Pitch fluctuation ±2.5 Hz around 120 Hz
  lfo.connect(lfoGain);
  lfoGain.connect(subBassOsc.frequency);

  // 120 Hz Resonant Bandpass Filter
  const bassFilter = ctx.createBiquadFilter();
  bassFilter.type = 'bandpass';
  bassFilter.frequency.setValueAtTime(120, ctx.currentTime);
  bassFilter.Q.setValueAtTime(3.5, ctx.currentTime);

  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(0.09, ctx.currentTime); // Soothing, warm sub-bass level

  subBassOsc.connect(bassFilter);
  bassFilter.connect(bassGain);

  subBassOsc.start();
  lfo.start();

  bassOscNode = subBassOsc;
  bassLfoNode = lfo;

  // Combine rumble and 120Hz sub-bass into output node
  const outputMix = ctx.createGain();
  outputMix.gain.setValueAtTime(1.0, ctx.currentTime);

  rumbleGain.connect(outputMix);
  bassGain.connect(outputMix);

  return outputMix;
}

// Synthesize a soft liquid lava bubble pop with 120Hz sub-bass impact
export function playLavaBubblePop() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Pitch sweep oscillator for liquid bubble rise & pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const startFreq = 160 + Math.random() * 100;
    const endFreq = 65 + Math.random() * 35;
    const duration = 0.2 + Math.random() * 0.2;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    // Soft bubble pop envelope
    const peakGain = 0.07 + Math.random() * 0.04;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);

    // Complementary 120Hz sub-bass drop impact for bubble resonance
    const subImpact = ctx.createOscillator();
    const subGain = ctx.createGain();
    subImpact.type = 'sine';
    subImpact.frequency.setValueAtTime(120, now);
    subImpact.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    subGain.gain.setValueAtTime(0.05, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    subImpact.connect(subGain);
    subImpact.start(now);
    subImpact.stop(now + 0.26);

    if (masterGain) {
      gain.connect(masterGain);
      subGain.connect(masterGain);
    } else {
      gain.connect(ctx.destination);
      subGain.connect(ctx.destination);
    }

    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (e) {
    console.error("Audio bubble error", e);
  }
}

// Start ambient sound loop with periodic lava bubbling
export function startAmbientLavaSound() {
  if (isPlaying) return;

  try {
    const ctx = getAudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const rumble = createMagmaRumbleNode(ctx);
    rumble.connect(masterGain);

    isPlaying = true;

    // Schedule random periodic gentle lava pops
    const scheduleNextBubble = () => {
      if (!isPlaying) return;
      playLavaBubblePop();
      const delay = 1200 + Math.random() * 2500; // Every 1.2 to 3.7 seconds
      bubbleTimer = window.setTimeout(scheduleNextBubble, delay);
    };

    scheduleNextBubble();
  } catch (e) {
    console.error("Failed to start ambient lava sound:", e);
  }
}

// Stop ambient sound
export function stopAmbientLavaSound() {
  if (!isPlaying) return;

  try {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
    }

    if (noiseNode) {
      (noiseNode as AudioBufferSourceNode).stop();
      noiseNode.disconnect();
      noiseNode = null;
    }

    if (bassOscNode) {
      bassOscNode.stop();
      bassOscNode.disconnect();
      bassOscNode = null;
    }

    if (bassLfoNode) {
      bassLfoNode.stop();
      bassLfoNode.disconnect();
      bassLfoNode = null;
    }

    if (masterGain && audioCtx) {
      masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        masterGain?.disconnect();
        masterGain = null;
      }, 350);
    }

    isPlaying = false;
  } catch (e) {
    console.error("Failed to stop ambient lava sound:", e);
  }
}

export function isAmbientLavaSoundPlaying() {
  return isPlaying;
}

import React, { useEffect, useRef } from 'react';

export type LavaPalette = 'cosmic' | 'volcanic' | 'deepsea' | 'cyber';

interface LavaLampProps {
  palette?: LavaPalette;
}

// Pastel Flame Color Schemes designed for fluid motion and rich visual depth
interface PastelFlameTheme {
  name: string;
  bgGrad: string;
  flameColors: string[];
  glowColor: string;
  accentAura: string;
}

const PASTEL_THEMES: Record<LavaPalette, PastelFlameTheme> = {
    cosmic: {
    name: 'Cotton Candy Cosmic Flame',
    bgGrad: 'linear-gradient(to bottom, #0f0a28 0%, #1c0e42 40%, #0a041c 100%)',
    flameColors: [
      'rgba(255, 60, 180, 1.0)',  // Vibrant Neon Pink
      'rgba(200, 90, 255, 0.95)', // Glowing Violet Lilac
      'rgba(56, 189, 248, 0.95)',  // Vivid Sky Blue
      'rgba(251, 146, 60, 0.95)',  // Bright Glowing Peach
      'rgba(250, 204, 21, 0.90)',  // Luminous Yellow Gold
    ],
    glowColor: 'rgba(236, 72, 153, 0.55)',
    accentAura: 'rgba(168, 85, 247, 0.45)',
  },
  volcanic: {
    name: 'Pastel Peach & Sunset Flame',
    bgGrad: 'linear-gradient(to bottom, #240508 0%, #3d0a0e 40%, #120204 100%)',
    flameColors: [
      'rgba(255, 100, 30, 1.0)',   // Vibrant Lava Tangerine
      'rgba(244, 63, 94, 0.95)',   // Radiant Hot Coral
      'rgba(251, 146, 60, 0.95)',  // Bright Peach Lava
      'rgba(253, 224, 71, 0.95)',  // Luminous Gold Core
      'rgba(225, 29, 72, 0.92)',   // Glowing Crimson
    ],
    glowColor: 'rgba(249, 115, 22, 0.6)',
    accentAura: 'rgba(244, 63, 94, 0.5)',
  },
  deepsea: {
    name: 'Pastel Aqua & Mint Ice Flame',
    bgGrad: 'linear-gradient(to bottom, #021a2b 0%, #052e47 40%, #010c17 100%)',
    flameColors: [
      'rgba(20, 240, 200, 1.0)',   // Vivid Neon Aqua
      'rgba(56, 189, 248, 0.95)',  // Vibrant Sky Cyan
      'rgba(165, 243, 252, 1.0)',  // Glowing Electric Ice
      'rgba(129, 140, 248, 0.92)', // Luminous Periwinkle
      'rgba(52, 211, 153, 0.95)',  // Bright Seafoam Mint
    ],
    glowColor: 'rgba(20, 184, 166, 0.6)',
    accentAura: 'rgba(56, 189, 248, 0.5)',
  },
  cyber: {
    name: 'Pastel Cyber Neon Flame',
    bgGrad: 'linear-gradient(to bottom, #190226 0%, #2e0545 40%, #0c0114 100%)',
    flameColors: [
      'rgba(240, 80, 255, 1.0)',   // Hot Electric Magenta
      'rgba(163, 230, 53, 0.95)',  // Popping Cyber Lime
      'rgba(34, 211, 238, 1.0)',   // Luminous Cyan
      'rgba(192, 132, 252, 0.95)', // Ultraviolet Glow
      'rgba(251, 113, 133, 0.95)', // Radiant Hot Pink
    ],
    glowColor: 'rgba(217, 70, 239, 0.6)',
    accentAura: 'rgba(132, 204, 22, 0.5)',
  },
};

export function LavaLampBackground({ palette = 'cosmic' }: LavaLampProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = PASTEL_THEMES[palette] || PASTEL_THEMES.cosmic;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // High performance authentic lava lamp thermal particle engine
    interface LavaBlob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      temp: number; // 0.0 (cold, sinks) to 1.0 (hot, rises)
      colorIdx: number;
      phase: number;
      wobbleSpeed: number;
      stretch: number;
    }

    let blobs: LavaBlob[] = [];

    const initParticles = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const minDim = Math.min(width, height);
      const count = Math.min(16, Math.max(8, Math.floor(width / 80)));

      blobs = Array.from({ length: count }).map((_, i) => {
        const radius = (0.07 + Math.random() * 0.09) * minDim;
        const temp = Math.random(); // Random initial heat state
        return {
          x: (0.1 + Math.random() * 0.8) * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: temp > 0.5 ? -0.4 - Math.random() * 0.4 : 0.3 + Math.random() * 0.3,
          radius,
          temp,
          colorIdx: i % theme.flameColors.length,
          phase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.008 + Math.random() * 0.012,
          stretch: 1.0,
        };
      });
    };

    initParticles();

    const handleResize = () => {
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // 120 FPS non-blocking render loop with bi-directional thermal convection
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Render liquid metaball shapes with screen blending
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // 1. Draw Organic Wavy Bottom Wax Reservoir Pool
      const timeSec = now / 1000;
      const bottomPoolHeight = height * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 15) {
        const wave = Math.sin(x * 0.008 + timeSec * 1.2) * 18 + Math.cos(x * 0.015 - timeSec * 0.8) * 12;
        ctx.lineTo(x, height - bottomPoolHeight + wave);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const bottomPoolGrad = ctx.createLinearGradient(0, height - bottomPoolHeight * 1.5, 0, height);
      bottomPoolGrad.addColorStop(0, theme.flameColors[0]);
      bottomPoolGrad.addColorStop(0.5, theme.flameColors[1]);
      bottomPoolGrad.addColorStop(1, theme.glowColor);
      ctx.fillStyle = bottomPoolGrad;
      ctx.fill();

      // 2. Draw Top Cooled Wax Accumulation Layer
      const topPoolHeight = height * 0.06;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= width; x += 15) {
        const wave = Math.sin(x * 0.01 - timeSec * 0.9) * 10;
        ctx.lineTo(x, topPoolHeight + wave);
      }
      ctx.lineTo(width, 0);
      ctx.closePath();

      const topPoolGrad = ctx.createLinearGradient(0, 0, 0, topPoolHeight * 1.8);
      topPoolGrad.addColorStop(0, theme.flameColors[2]);
      topPoolGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topPoolGrad;
      ctx.fill();

      // 3. Update & Draw Floating Bi-Directional Lava Blobs
      blobs.forEach((b) => {
        b.phase += b.wobbleSpeed;

        // Thermal Dynamics (Heating at bottom, Cooling at top)
        if (b.y > height * 0.7) {
          // Heat up at bottom pool
          b.temp = Math.min(1.0, b.temp + dt * 0.35);
        } else if (b.y < height * 0.25) {
          // Cool down at top ceiling
          b.temp = Math.max(0.0, b.temp - dt * 0.30);
        }

        // Target vertical velocity based on temperature buoyancy
        // Hot (temp ~ 1) => buoyancy force UP (negative vy)
        // Cold (temp ~ 0) => gravity force DOWN (positive vy)
        const targetVy = (0.45 - b.temp) * 1.4; 
        b.vy += (targetVy - b.vy) * dt * 2.0;

        // Horizontal fluid drift and side wobble
        b.vx += (Math.sin(b.phase) * 0.25 - b.vx) * dt * 1.5;

        // Apply motion
        b.y += b.vy * dt * 60;
        b.x += b.vx * dt * 60;

        // Elongation stretch along motion vector
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.stretch = Math.min(1.6, 1.0 + speed * 0.35);

        // Soft rebound bounds
        if (b.x < b.radius * 0.5) b.vx = Math.abs(b.vx) + 0.1;
        if (b.x > width - b.radius * 0.5) b.vx = -Math.abs(b.vx) - 0.1;

        // Draw organic lava blob with white-hot glowing core
        const color = theme.flameColors[b.colorIdx];
        const radGrad = ctx.createRadialGradient(
          b.x, b.y, 0,
          b.x, b.y, b.radius * 1.5
        );

        radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); // Glowing white-hot molten center
        radGrad.addColorStop(0.3, color);                   // Saturated vibrant color
        radGrad.addColorStop(0.7, color.replace(/[\d\.]+\)$/, '0.65)')); // Glowing aura
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.save();
        ctx.translate(b.x, b.y);
        // Angle direction of elongation
        const angle = Math.atan2(b.vy, b.vx) - Math.PI / 2;
        ctx.rotate(angle);
        ctx.scale(1 / Math.sqrt(b.stretch), Math.sqrt(b.stretch)); // Preserve blob volume

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [palette, theme]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* 120 FPS CSS Hardware Accelerated Seamless Pastel Flame Wave Gradients */}
      <div 
        className="absolute inset-0 w-full h-full transition-all duration-1000"
        style={{ background: theme.bgGrad }}
      />

      {/* Continuously Morphing Pastel Flame Waves - Crisp Unblurred High-Definition GPU Layer */}
      <div className="absolute inset-0 w-full h-full opacity-95 mix-blend-screen filter blur-[2px] sm:blur-[4px]">
        {/* Flame Plume 1 */}
        <div 
          className="absolute -bottom-20 left-[10%] w-[50vw] h-[70vh] rounded-full animate-pastel-flame-1"
          style={{
            background: `radial-gradient(circle, ${theme.flameColors[0]} 0%, ${theme.flameColors[1]} 60%, transparent 85%)`,
            willChange: 'transform',
          }}
        />

        {/* Flame Plume 2 */}
        <div 
          className="absolute -bottom-30 right-[15%] w-[55vw] h-[75vh] rounded-full animate-pastel-flame-2"
          style={{
            background: `radial-gradient(circle, ${theme.flameColors[2]} 0%, ${theme.flameColors[3]} 60%, transparent 85%)`,
            willChange: 'transform',
          }}
        />

        {/* Center Rising Core Flame */}
        <div 
          className="absolute bottom-0 left-[30%] w-[45vw] h-[85vh] rounded-full animate-pastel-flame-3"
          style={{
            background: `radial-gradient(circle, ${theme.flameColors[4] || theme.flameColors[0]} 0%, ${theme.flameColors[1]} 65%, transparent 90%)`,
            willChange: 'transform',
          }}
        />
      </div>

      {/* 120FPS Canvas Liquid Wax Fluid Particles */}
      <canvas ref={canvasRef} className="block absolute inset-0 w-full h-full opacity-95 mix-blend-screen" />

      {/* Bottom Heater Base Glow */}
      <div 
        className="absolute bottom-0 inset-x-0 h-72 pointer-events-none transition-all duration-1000 blur-xl"
        style={{
          background: `linear-gradient(to top, ${theme.glowColor} 0%, ${theme.accentAura} 50%, transparent 100%)`,
        }}
      />

      {/* Top Subtle Ambient Vignette for Chat Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/40 pointer-events-none" />

      {/* CSS Keyframes inline style for smooth 120 FPS GPU animations */}
      <style>{`
        @keyframes pastelFlame1 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate3d(4vw, -8vh, 0) scale(1.15) rotate(5deg);
          }
          66% {
            transform: translate3d(-3vw, -16vh, 0) scale(0.95) rotate(-5deg);
          }
        }

        @keyframes pastelFlame2 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1.1) rotate(0deg);
          }
          40% {
            transform: translate3d(-5vw, -12vh, 0) scale(0.9) rotate(-8deg);
          }
          75% {
            transform: translate3d(3vw, -20vh, 0) scale(1.2) rotate(6deg);
          }
        }

        @keyframes pastelFlame3 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.95);
          }
          50% {
            transform: translate3d(2vw, -18vh, 0) scale(1.18);
          }
        }

        .animate-pastel-flame-1 {
          animation: pastelFlame1 18s ease-in-out infinite;
        }

        .animate-pastel-flame-2 {
          animation: pastelFlame2 22s ease-in-out infinite;
        }

        .animate-pastel-flame-3 {
          animation: pastelFlame3 26s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

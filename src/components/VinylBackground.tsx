import React from 'react';
import { motion } from 'motion/react';

export function VinylBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Rich Gradient Base */}
      <div className="absolute inset-0 bg-slate-950 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-purple-950/90" />

      {/* Floating Animated Vinyl Records */}
      
      {/* Vinyl 1 - Top Left */}
      <motion.div
        animate={{ rotate: 360, x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, x: { duration: 12, repeat: Infinity, ease: "easeInOut" }, y: { duration: 15, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -top-20 -left-20 w-[32rem] h-[32rem] opacity-20 sm:opacity-25 filter blur-[1px] mix-blend-screen"
      >
        <div className="relative w-full h-full rounded-full bg-black border-[12px] border-slate-900 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex items-center justify-center">
          {/* Grooves */}
          <div className="absolute inset-4 rounded-full border border-white/10" />
          <div className="absolute inset-10 rounded-full border border-white/10" />
          <div className="absolute inset-16 rounded-full border border-white/10" />
          <div className="absolute inset-22 rounded-full border border-white/10" />
          <div className="absolute inset-28 rounded-full border border-white/10" />
          {/* Label */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 border-4 border-black flex items-center justify-center shadow-inner">
            <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-white/40" />
          </div>
          {/* Specular Highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Vinyl 2 - Bottom Right */}
      <motion.div
        animate={{ rotate: -360, x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ rotate: { duration: 30, repeat: Infinity, ease: "linear" }, x: { duration: 16, repeat: Infinity, ease: "easeInOut" }, y: { duration: 18, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] opacity-15 sm:opacity-20 filter blur-[2px] mix-blend-screen"
      >
        <div className="relative w-full h-full rounded-full bg-black border-[16px] border-slate-900 shadow-[0_0_60px_rgba(66,133,244,0.3)] flex items-center justify-center">
          {/* Grooves */}
          <div className="absolute inset-6 rounded-full border border-white/10" />
          <div className="absolute inset-14 rounded-full border border-white/10" />
          <div className="absolute inset-22 rounded-full border border-white/10" />
          <div className="absolute inset-30 rounded-full border border-white/10" />
          <div className="absolute inset-38 rounded-full border border-white/10" />
          {/* Label */}
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-600 border-4 border-black flex items-center justify-center shadow-inner">
            <div className="w-7 h-7 rounded-full bg-slate-950 border-2 border-white/40" />
          </div>
          {/* Specular Highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Vinyl 3 - Center Right Floating */}
      <motion.div
        animate={{ rotate: 360, x: [0, -25, 20, 0], y: [0, -30, 20, 0] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, x: { duration: 14, repeat: Infinity, ease: "easeInOut" }, y: { duration: 12, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute top-1/4 right-[-10rem] w-[26rem] h-[26rem] opacity-20 filter mix-blend-screen"
      >
        <div className="relative w-full h-full rounded-full bg-black border-[10px] border-slate-900 shadow-[0_0_40px_rgba(234,67,53,0.3)] flex items-center justify-center">
          <div className="absolute inset-4 rounded-full border border-white/10" />
          <div className="absolute inset-10 rounded-full border border-white/10" />
          <div className="absolute inset-16 rounded-full border border-white/10" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 border-3 border-black flex items-center justify-center shadow-inner">
            <div className="w-5 h-5 rounded-full bg-slate-950 border border-white/40" />
          </div>
        </div>
      </motion.div>

      {/* Glassmorphic Grain / Overlay Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import '@/components/landing/landing.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  cr: number;
  cg: number;
  cb: number;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  rot: number;
  cr: number;
  cg: number;
  cb: number;
}

const PAL = [
  { r: 20, g: 184, b: 184 },
  { r: 57, g: 255, b: 20 },
  { r: 0, g: 255, b: 247 },
  { r: 94, g: 234, b: 212 },
  { r: 255, g: 255, b: 255 },
];

export function SparkleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const particles: Particle[] = [];
    const sparkles: Sparkle[] = [];

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function createParticle(init = false) {
      const c = PAL[Math.floor(Math.random() * 4)];
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.55 + 0.2),
        r: Math.random() * 1.8 + 0.4,
        life: 0,
        maxLife: Math.random() * 280 + 160,
        cr: c.r,
        cg: c.g,
        cb: c.b,
      } as Particle;
    }

    function createSparkle(init = false) {
      const c = PAL[Math.floor(Math.random() * PAL.length)];
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : Math.random() * H,
        size: Math.random() * 2 + 0.4,
        life: init ? Math.random() * 120 : 0,
        maxLife: Math.random() * 100 + 60,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI,
        cr: c.r,
        cg: c.g,
        cb: c.b,
      } as Sparkle;
    }

    for (let i = 0; i < 70; i++) particles.push(createParticle(true));
    for (let i = 0; i < 40; i++) sparkles.push(createSparkle(true));

    let lastBurst = 0;
    function onMouseMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastBurst < 120) return;
      lastBurst = now;
      const sp = sparkles[Math.floor(Math.random() * sparkles.length)];
      sp.x = e.clientX + (Math.random() - 0.5) * 40;
      sp.y = e.clientY + (Math.random() - 0.5) * 40;
      sp.life = 0;
      sp.maxLife = 60 + Math.random() * 40;
      sp.size = Math.random() * 2 + 1;
      const c = PAL[Math.floor(Math.random() * PAL.length)];
      sp.cr = c.r;
      sp.cg = c.g;
      sp.cb = c.b;
    }
    window.addEventListener('mousemove', onMouseMove);

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, W, H);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife || p.y < -10) {
          particles[i] = createParticle(false);
        } else {
          const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.5;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${a})`;
          ctx!.fill();
        }
      }

      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        if (s.life > s.maxLife) {
          sparkles[i] = createSparkle(false);
        } else {
          const t = s.life / s.maxLife;
          const a = Math.sin(t * Math.PI) * 0.8;
          const size = s.size * (1 - t * 0.3);
          ctx!.save();
          ctx!.translate(s.x, s.y);
          ctx!.rotate(s.rot + s.life * 0.015);
          ctx!.globalAlpha = a;
          ctx!.fillStyle = `rgb(${s.cr},${s.cg},${s.cb})`;
          ctx!.beginPath();
          for (let j = 0; j < 8; j++) {
            const ang = (j * Math.PI) / 4;
            const rad = j % 2 === 0 ? size * 2.5 : size * 0.9;
            if (j === 0) ctx!.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
            else ctx!.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          }
          ctx!.closePath();
          ctx!.fill();
          const g = ctx!.createRadialGradient(0, 0, 0, 0, 0, size * 4);
          g.addColorStop(0, `rgba(${s.cr},${s.cg},${s.cb},${a * 0.35})`);
          g.addColorStop(1, `rgba(${s.cr},${s.cg},${s.cb},0)`);
          ctx!.beginPath();
          ctx!.arc(0, 0, size * 4, 0, Math.PI * 2);
          ctx!.fillStyle = g;
          ctx!.fill();
          ctx!.restore();
          ctx!.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="sparkle-canvas" aria-hidden="true" />;
}

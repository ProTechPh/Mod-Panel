'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouse);

    const spawn = () => {
      if (particles.length < 80) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 3 + 1,
          life: 0,
          maxLife: 200 + Math.random() * 200,
          hue: Math.random() * 60 + 140,
        });
      }
    };

    const isDark = () => document.documentElement.classList.contains('dark');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.vx -= dx / dist * 0.02;
          p.vy -= dy / dist * 0.02;
        }

        p.vx *= 0.99;
        p.vy *= 0.99;

        const alpha = (1 - p.life / p.maxLife) * (isDark() ? 0.5 : 0.25);
        const size = p.size * (1 - p.life / p.maxLife * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, ${isDark() ? '60%' : '40%'}, ${alpha})`;
        ctx.fill();

        if (size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 70%, ${isDark() ? '60%' : '40%'}, ${alpha * 0.15})`;
          ctx.fill();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const connAlpha = (1 - cdist / 100) * (isDark() ? 0.15 : 0.08);
            ctx.strokeStyle = `hsla(${p.hue}, 70%, ${isDark() ? '60%' : '40%'}, ${connAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[3] pointer-events-none"
      aria-hidden="true"
    />
  );
}

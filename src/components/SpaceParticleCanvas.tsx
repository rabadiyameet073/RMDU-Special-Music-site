import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
  vx: number;
  vy: number;
}

export function SpaceParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates for cosmic parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Cosmic Palette
    const colors = ["#ffffff", "#fef08a", "#fde047", "#e0e7ff", "#93c5fd", "#c4b5fd"];
    const count = window.innerWidth < 768 ? 160 : 320;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.8,
        y: (Math.random() - 0.5) * height * 1.8,
        z: Math.random() * 1000 + 50,
        size: Math.random() * 2 + 0.6,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    let time = 0;
    const render = () => {
      time += 0.015;
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;

      const normMouseX = (mouseX - width / 2) / (width / 2);
      const normMouseY = (mouseY - height / 2) / (height / 2);

      // Deep space void with subtle cosmic nebula gradient
      ctx.clearRect(0, 0, width, height);

      // Deep Space Background Glow
      const bgGrad = ctx.createRadialGradient(
        width / 2 - normMouseX * 100,
        height / 2 - normMouseY * 100,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, "#080b14");
      bgGrad.addColorStop(0.4, "#05070d");
      bgGrad.addColorStop(1, "#020306");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle celestial nebula dust clouds
      const nebula1 = ctx.createRadialGradient(
        width * 0.3 - normMouseX * 60,
        height * 0.4 - normMouseY * 60,
        10,
        width * 0.3,
        height * 0.4,
        width * 0.5
      );
      nebula1.addColorStop(0, "rgba(59, 130, 246, 0.08)");
      nebula1.addColorStop(0.6, "rgba(147, 51, 234, 0.04)");
      nebula1.addColorStop(1, "transparent");
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(
        width * 0.7 + normMouseX * 60,
        height * 0.6 + normMouseY * 60,
        10,
        width * 0.7,
        height * 0.6,
        width * 0.55
      );
      nebula2.addColorStop(0, "rgba(217, 119, 6, 0.07)");
      nebula2.addColorStop(0.5, "rgba(245, 158, 11, 0.03)");
      nebula2.addColorStop(1, "transparent");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw star particles with 3D projection & mouse depth parallax
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.twinkleSpeed;

        // Wrap around bounds
        if (p.x < -width) p.x = width;
        if (p.x > width) p.x = -width;
        if (p.y < -height) p.y = height;
        if (p.y > height) p.y = -height;

        // 3D Perspective Projection
        const fov = 400;
        const depth = p.z;
        const scale = fov / (fov + depth);

        const px = cx + (p.x - normMouseX * (1200 - depth) * 0.15) * scale;
        const py = cy + (p.y - normMouseY * (1200 - depth) * 0.15) * scale;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

        const currentAlpha = Math.max(
          0.1,
          Math.min(1, p.baseAlpha * (0.65 + 0.35 * Math.sin(p.phase)))
        );
        const radius = Math.max(0.5, p.size * scale * 1.5);

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = radius > 1.8 ? 6 : 2;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full pointer-events-none z-0"
    />
  );
}

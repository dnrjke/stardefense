export function generateAppIcon(): void {
  const size = 180;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  if (!ctx) return;

  const cx = size / 2;
  const cy = cx * 0.96;

  // Rounded rect clip (iOS style)
  const r = size * 0.195;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.clip();

  // Background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7);
  bg.addColorStop(0, '#0a0a2e');
  bg.addColorStop(1, '#020210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Background stars
  ctx.fillStyle = '#aaccff';
  const stars = [
    [28, 25, 0.7], [148, 32, 0.5], [50, 140, 0.6], [137, 133, 0.5],
    [22, 88, 0.4], [158, 70, 0.6], [70, 158, 0.5], [123, 21, 0.4],
    [35, 56, 0.3], [155, 109, 0.4], [109, 155, 0.5], [60, 35, 0.3],
  ];
  for (const [sx, sy, op] of stars) {
    ctx.globalAlpha = op;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Outer aura
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
  aura.addColorStop(0, 'rgba(255,170,51,0.25)');
  aura.addColorStop(0.5, 'rgba(255,102,34,0.08)');
  aura.addColorStop(1, 'rgba(255,34,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.fill();

  // Shield arcs
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';

  // Outer arc
  ctx.strokeStyle = '#4488ff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, 56, -Math.PI * 0.8, -Math.PI * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 56, Math.PI * 0.2, Math.PI * 0.9);
  ctx.stroke();

  // Inner arc
  ctx.strokeStyle = '#8855ff';
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 42, -Math.PI * 0.5, Math.PI * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 42, Math.PI * 0.5, Math.PI * 1.2);
  ctx.stroke();

  // Tower dots
  ctx.globalAlpha = 0.9;
  const dots: [number, string][] = [
    [-0.8, '#66aaff'], [0.2, '#88ccff'], [0.9, '#66aaff'],
  ];
  for (const [angle, color] of dots) {
    ctx.fillStyle = color as string;
    ctx.shadowColor = color as string;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle * Math.PI) * 56, cy + Math.sin(angle * Math.PI) * 56, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Central star
  ctx.globalAlpha = 1;
  const star = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
  star.addColorStop(0, '#ffffff');
  star.addColorStop(0.15, '#fff8e0');
  star.addColorStop(0.4, '#ffcc44');
  star.addColorStop(0.7, '#ff8811');
  star.addColorStop(1, 'rgba(255,68,0,0)');
  ctx.fillStyle = star;
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fill();

  // Star highlight
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Threat dots
  ctx.shadowBlur = 3;
  ctx.shadowColor = '#ff4444';
  ctx.fillStyle = '#ff4444';
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(155, 35, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(162, 46, 1, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(25, 140, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // "SD" text
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#88aaff';
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.shadowColor = '#4466ff';
  ctx.shadowBlur = 6;
  ctx.fillText('SD', cx, size - 8);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Apply as apple-touch-icon
  const dataUrl = c.toDataURL('image/png');
  let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.appendChild(link);
  }
  link.href = dataUrl;

  // Also set as favicon (for browsers that don't support SVG favicon)
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/png"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    document.head.appendChild(favicon);
  }
  favicon.href = dataUrl;
}

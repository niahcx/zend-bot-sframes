// Gera o banner do sistema de tickets com marca SFrames
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import path from 'path';

const W = 960, H = 320;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Fundo gradiente
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, '#10121c');
grad.addColorStop(0.6, '#171a2e');
grad.addColorStop(1, '#221545');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// Brilho decorativo
const glow = ctx.createRadialGradient(W - 140, 40, 20, W - 140, 40, 340);
glow.addColorStop(0, 'rgba(88,101,242,0.4)');
glow.addColorStop(1, 'rgba(88,101,242,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

// Círculos decorativos
ctx.strokeStyle = 'rgba(255,255,255,0.06)';
for (let i = 0; i < 4; i++) {
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(120 + i * 8, H - 30, 60 + i * 42, 0, Math.PI * 2);
  ctx.stroke();
}

// Moldura arredondada
ctx.strokeStyle = 'rgba(88,101,242,0.85)';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(3, 3, W - 6, H - 6, 24);
ctx.stroke();

// Ícone de suporte (balão de chat desenhado)
ctx.save();
ctx.translate(84, 96);
ctx.fillStyle = '#5865F2';
ctx.beginPath();
ctx.roundRect(0, 0, 92, 70, [20, 20, 20, 4]);
ctx.fill();
ctx.fillStyle = '#ffffff';
for (let i = 0; i < 3; i++) {
  ctx.beginPath();
  ctx.arc(22 + i * 24, 35, 6, 0, Math.PI * 2);
  ctx.fill();
}
ctx.restore();

// Título
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 56px sans-serif';
ctx.fillText('Central de Atendimento', 200, 128);

// Subtítulo
ctx.fillStyle = '#aab1ff';
ctx.font = '600 28px sans-serif';
ctx.fillText('Suporte rápido · Seguro · SFrames', 202, 172);

// Linha divisória
ctx.strokeStyle = 'rgba(255,255,255,0.12)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(204, 196);
ctx.lineTo(W - 60, 196);
ctx.stroke();

// Descrição
ctx.fillStyle = '#8b90a7';
ctx.font = '400 22px sans-serif';
ctx.fillText('Abra um ticket e nossa equipe responde em instantes.', 204, 232);

// Badge
ctx.fillStyle = 'rgba(88,101,242,0.25)';
ctx.beginPath();
ctx.roundRect(204, 252, 130, 34, 17);
ctx.fill();
ctx.strokeStyle = '#5865F2';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.roundRect(204, 252, 130, 34, 17);
ctx.stroke();
ctx.fillStyle = '#aab1ff';
ctx.font = 'bold 19px sans-serif';
ctx.fillText('🛡️ SFrames', 222, 275);

const out = path.resolve('assets/TicketSFrames.png');
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Ticket banner gerado em', out);

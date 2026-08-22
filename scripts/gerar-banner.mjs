// Gera um novo banner principal com marca SFrames (substitui assets/Noite.png)
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import path from 'path';

const W = 900, H = 260;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Fundo gradiente escuro
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, '#0f1117');
grad.addColorStop(0.55, '#161a2b');
grad.addColorStop(1, '#1b1440');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// Brilho roxo decorativo
const glow = ctx.createRadialGradient(W - 120, H - 40, 20, W - 120, H - 40, 320);
glow.addColorStop(0, 'rgba(88,101,242,0.45)');
glow.addColorStop(1, 'rgba(88,101,242,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

// Moldura arredondada
ctx.strokeStyle = 'rgba(88,101,242,0.8)';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(3, 3, W - 6, H - 6, 22);
ctx.stroke();

// Texto principal
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 64px sans-serif';
ctx.fillText('SFrames', 48, 108);

ctx.fillStyle = '#c9cdf5';
ctx.font = '600 30px sans-serif';
ctx.fillText('Painel de Controle', 50, 158);

// Descrição
ctx.fillStyle = '#8b90a7';
ctx.font = '400 21px sans-serif';
ctx.fillText('Boa noite! Aqui você pode gerenciar sua aplicação com total liberdade.', 50, 205);

// Badge "SFrames"
ctx.fillStyle = 'rgba(88,101,242,0.25)';
ctx.beginPath();
ctx.roundRect(50, 222, 118, 30, 15);
ctx.fill();
ctx.strokeStyle = '#5865F2';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.roundRect(50, 222, 118, 30, 15);
ctx.stroke();
ctx.fillStyle = '#aab1ff';
ctx.font = 'bold 17px sans-serif';
ctx.fillText('SFrames', 68, 243);

const out = path.resolve('assets/Noite.png');
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Banner gerado em', out);

// Gera o banner do sistema Anti-SelfBot com marca SFrames
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import path from 'path';

const W = 900, H = 280;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, '#170f14');
grad.addColorStop(0.6, '#241019');
grad.addColorStop(1, '#3a0d18');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

const glow = ctx.createRadialGradient(W - 130, H - 50, 20, W - 130, H - 50, 300);
glow.addColorStop(0, 'rgba(237,66,69,0.35)');
glow.addColorStop(1, 'rgba(237,66,69,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

ctx.strokeStyle = 'rgba(237,66,69,0.85)';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.roundRect(3, 3, W - 6, H - 6, 22);
ctx.stroke();

// Escudo
ctx.save();
ctx.translate(78, 84);
ctx.fillStyle = '#ED4245';
ctx.beginPath();
ctx.moveTo(45, 0);
ctx.lineTo(90, 16);
ctx.lineTo(90, 52);
ctx.quadraticCurveTo(90, 82, 45, 100);
ctx.quadraticCurveTo(0, 82, 0, 52);
ctx.lineTo(0, 16);
ctx.closePath();
ctx.fill();
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 7;
ctx.beginPath();
ctx.moveTo(26, 50);
ctx.lineTo(40, 64);
ctx.lineTo(66, 34);
ctx.stroke();
ctx.restore();

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 54px sans-serif';
ctx.fillText('Anti-SelfBot', 196, 122);

ctx.fillStyle = '#ff9a9c';
ctx.font = '600 27px sans-serif';
ctx.fillText('Proteção automática · Banimento instantâneo', 198, 164);

ctx.fillStyle = '#8b8fa3';
ctx.font = '400 21px sans-serif';
ctx.fillText('Quem postar no canal monitorado é banido na hora,', 200, 210);
ctx.fillText('com mensagens dos últimos 7 dias apagadas.', 200, 240);

ctx.fillStyle = 'rgba(237,66,69,0.25)';
ctx.beginPath();
ctx.roundRect(200, 252, 132, 32, 16);
ctx.fill();
ctx.fillStyle = '#ffb3b5';
ctx.font = 'bold 18px sans-serif';
ctx.fillText('🛡️ SFrames', 216, 274);

const out = path.resolve('assets/AntiSelfBot.png');
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('Banner Anti-SelfBot gerado em', out);

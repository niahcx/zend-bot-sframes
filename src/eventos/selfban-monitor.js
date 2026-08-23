// Monitor Anti-SelfBot: quem enviar mensagem/foto no canal armadilha (texto ou call)
// leva castigo de 3 horas na hora, com log detalhado. O bot avisa no canal para
// ninguém enviar nada.

import { EmbedBuilder } from 'discord.js';
import { state, guildState, saveState } from '../database/estado.js';

const CASTIGO_MS = 3 * 60 * 60 * 1000; // 3 horas
const avisoEnviadoEm = new Map(); // guildId -> timestamp do último aviso (anti-spam)

export function avisoArmadilha() {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('⚠️ ATENÇÃO — LEIA ANTES DE FAZER QUALQUER COISA')
        .setDescription(
          [
            '**🚫 NÃO envie mensagens, fotos, vídeos ou links aqui!**',
            '',
            '⏱️ Quem enviar **qualquer coisa** neste canal/call leva **castigo de 3 horas** na hora.',
            '🛡️ Este canal é monitorado pelo **Anti-SelfBot**.',
          ].join('\n'),
        ),
    ],
  };
}

export async function enviarAvisoCanalArmadilha(canal) {
  if (!canal?.isTextBased?.()) return;
  await canal.send(avisoArmadilha()).catch(() => {});
}

export function registrarSelfBan(client) {
  // ── Armadilha: mensagem/foto no canal monitorado = castigo de 3h ──
  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild || message.author.bot) return;

      const gs = state.guilds?.[message.guild.id] || guildState(message.guild.id);
      const sb = gs.selfban;
      if (!sb?.ativo || !sb.canalMonitor) return;
      if (message.channel.id !== sb.canalMonitor) return;

      // Staff do servidor é ignorado
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!member) return;
      if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) {
        await message.channel.send(`⚠️ <@${message.author.id}> é staff — Anti-SelfBot ignorou a mensagem.`).catch(() => {});
        return;
      }

      // Castigo de 3h (timeout de comunicação)
      try {
        await member.timeout(CASTIGO_MS, 'SFrames · Enviou mensagem no canal armadilha (Anti-SelfBot)');
      } catch (err) {
        await saveState().catch(() => {});
        if (sb.canalLog) {
          const canalLog = await client.channels.fetch(sb.canalLog).catch(() => null);
          await canalLog
            ?.send(`❌ **Não consegui castigar** <@${message.author.id}> — preciso da permissão **Moderar membros** e do cargo acima do dele. (\`${err.message}\`)`)
            .catch(() => {});
        }
        return;
      }
      sb.bans = (sb.bans || 0) + 1;
      await saveState();

      // Apaga a mensagem infratora
      await message.delete().catch(() => {});

      // Log
      if (sb.canalLog) {
        const canalLog = await client.channels.fetch(sb.canalLog).catch(() => null);
        if (canalLog) {
          const e = new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('⏱️ Castigo aplicado — Anti-SelfBot')
            .setThumbnail(message.author.displayAvatarURL({ extension: 'png', size: 128 }))
            .addFields(
              { name: '👤 Usuário', value: `\`${message.author.tag}\` (\`${message.author.id}\`)`, inline: false },
              { name: '⏱️ Castigo', value: '`3 horas` sem falar', inline: true },
              { name: '📊 Total de castigos', value: `\`${sb.bans}\``, inline: true },
              { name: '📍 Onde', value: `<#${message.channelId}>`, inline: false },
              { name: '💬 Mensagem enviada', value: (message.content || '*(sem texto — foto/anexo?)*').slice(0, 1000) },
            );
          if (message.attachments.size) {
            e.setImage(message.attachments.first().url);
          }
          await canalLog.send({ embeds: [e] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[selfban]', err.message);
    }
  });

  // ── Aviso automático: alguém entrou na call armadilha → avisa na hora ──
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      if (!newState.channelId || oldState.channelId === newState.channelId) return;
      if (newState.id === client.user.id) return;
      const gs = state.guilds?.[newState.guild.id] || guildState(newState.guild.id);
      const sb = gs.selfban;
      if (!sb?.ativo || !sb.canalMonitor) return;
      if (newState.channelId !== sb.canalMonitor) return;

      const agora = Date.now();
      if (agora - (avisoEnviadoEm.get(newState.guild.id) || 0) < 30_000) return;
      avisoEnviadoEm.set(newState.guild.id, agora);

      await enviarAvisoCanalArmadilha(newState.channel);
    } catch (err) {
      console.error('[selfban-voice]', err.message);
    }
  });
}

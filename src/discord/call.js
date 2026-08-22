// Sistema de call: o bot entra no canal de voz e fica lá,
// reconectando automaticamente se a conexão cair.

import {
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { ChannelType } from 'discord.js';

// guildId → channelId desejado
const alvos = new Map();

export async function entrarEmCall(guild, canalId) {
  const canal = await guild.channels.fetch(canalId).catch(() => null);
  if (!canal) return { ok: false, msg: '❌ Canal não encontrado. Verifique o ID.' };
  const tipos = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];
  if (!tipos.includes(canal.type)) {
    return { ok: false, msg: '❌ Esse canal não é de voz (use o ID de um canal de voz ou palco).' };
  }

  alvos.set(guild.id, canal.id);

  const connection = joinVoiceChannel({
    channelId: canal.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      // Conexão realmente caiu — destrói e reconecta sozinho
      connection.destroy();
      const alvo = alvos.get(guild.id);
      if (alvo) {
        setTimeout(() => {
          if (alvos.get(guild.id) !== alvo) return;
          const g = guild.client?.guilds?.cache?.get(guild.id);
          if (g) entrarEmCall(g, alvo).catch(() => {});
        }, 5_000);
      }
    }
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    return { ok: true, canal };
  } catch {
    return { ok: true, canal, aviso: '⚠️ Entrei, mas a conexão ainda está estabilizando.' };
  }
}

export function sairDaCall(guildId) {
  alvos.delete(guildId);
  const conn = getVoiceConnection(guildId);
  if (conn) conn.destroy();
  return Boolean(conn);
}

export function callAtual(guildId) {
  return alvos.get(guildId) || null;
}

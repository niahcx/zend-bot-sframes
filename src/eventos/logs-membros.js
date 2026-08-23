// Logs de Entrada/Saída: registra quem entrou e quem saiu do servidor.
// - Mensagem 100% personalizável via /panel → Logs Entrada/Saída
// - NUNCA menciona a pessoa (sem ping, placeholders só com nome)
// - Recomendado usar canal visível apenas para a staff (admins)

import { EmbedBuilder } from 'discord.js';
import { guildState } from '../database/estado.js';
import { parseHex, renderMemberLogs } from '../utilidades/formatacao.js';

export function registrarLogsMembros(client) {
  async function enviar(guild, canalId, ml, template, member, tipo) {
    if (!canalId || !template) return;
    const canal = await guild.channels.fetch(canalId).catch(() => null);
    if (!canal?.isTextBased()) return;

    const texto = renderMemberLogs(template, member);
    const payload = ml.modoEmbed
      ? {
          embeds: [
            new EmbedBuilder()
              .setDescription(texto)
              .setColor(parseHex(ml.cor))
              .setAuthor({
                name: `${member.user?.tag || member.user?.username || 'Desconhecido'} · ${tipo === 'entrada' ? 'entrou no servidor' : 'saiu do servidor'}`,
                iconURL: member.user?.displayAvatarURL?.({ extension: 'png', size: 128 }) || undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
        }
      : { content: texto, allowedMentions: { parse: [] } };

    await canal.send(payload).catch(() => null);
  }

  client.on('guildMemberAdd', async (member) => {
    try {
      const gs = guildState(member.guild.id);
      const ml = gs.memberLogs;
      if (!ml?.enabled || !ml.canalEntrada) return;
      await enviar(member.guild, ml.canalEntrada, ml, ml.mensagemEntrada, member, 'entrada');
    } catch (err) {
      console.error('[logs-membros]', err.message);
    }
  });

  client.on('guildMemberRemove', async (member) => {
    try {
      const gs = guildState(member.guild.id);
      const ml = gs.memberLogs;
      if (!ml?.enabled || !ml.canalSaida) return;
      await enviar(member.guild, ml.canalSaida, ml, ml.mensagemSaida, member, 'saida');
    } catch (err) {
      console.error('[logs-membros]', err.message);
    }
  });
}

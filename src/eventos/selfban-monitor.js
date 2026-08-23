// Monitor Anti-SelfBot: quem postar no canal armadilha é banido na hora,
// com mensagens dos últimos 7 dias apagadas + log detalhado.

import { ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';
import { state, guildState, saveState } from '../database/estado.js';

export function registrarSelfBan(client) {
  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild || message.author.bot) return;

      const gs = state.guilds?.[message.guild.id] || guildState(message.guild.id);
      const sb = gs.selfban;
      if (!sb?.ativo || !sb.canalMonitor) return;
      if (message.channel.id !== sb.canalMonitor) return;

      // Não bana admins do painel nem o dono
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!member) return;
      if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) {
        await message.channel.send(`⚠️ <@${message.author.id}> é staff — Anti-SelfBot ignorou a mensagem.`).catch(() => {});
        return;
      }

      // Ban com deleção de 7 dias de mensagens
      await message.guild.members.ban(message.author.id, {
        deleteMessageSeconds: 604800,
        reason: 'SFrames · SelfBot detectado no canal monitorado',
      });
      sb.bans = (sb.bans || 0) + 1;
      await saveState();

      // Log
      if (sb.canalLog) {
        const canalLog = await client.channels.fetch(sb.canalLog).catch(() => null);
        if (canalLog) {
          const container = new ContainerBuilder()
            .setAccentColor(0xed4245)
            .addSectionComponents(
              new SectionBuilder()
                .setThumbnailAccessory(
                  new ThumbnailBuilder().setURL(
                    message.author.displayAvatarURL({ extension: 'png', size: 128 }),
                  ),
                )
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(
                    [
                      '## 🔨 SelfBot Banido!',
                      `**👤 Usuário:** \`${message.author.tag}\``,
                      `**🆔 ID:** \`${message.author.id}\``,
                      `**📊 Total de bans:** \`${sb.bans}\``,
                    ].join('\n'),
                  ),
                ),
            )
            .addSeparatorComponents(
              new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `**💬 Mensagem enviada:**\n${(message.content || '*(sem texto)*').slice(0, 1000)}`,
              ),
            );

          const anexos = [...message.attachments.values()].slice(0, 3);
          if (anexos.length) {
            container.addMediaGalleryComponents({
              items: anexos.map((a) => ({ media: { url: a.url } })),
            });
          }

          await canalLog.send({ flags: MessageFlags.IsComponentsV2, components: [container] }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[selfban]', err.message);
    }
  });
}

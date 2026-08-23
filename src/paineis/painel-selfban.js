// Painel Anti-SelfBot: monitora um canal, bane quem postar nele e registra logs.

import { localAsset } from '../configuracoes/assets-zend.js';
import { embed, button, id } from '../discord/componentes.js';
import { ButtonStyle, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';

export function selfbanPanel(guild, gs) {
  const sb = gs.selfban || {};
  const banner = localAsset('AntiSelfBot.png');

  const e = embed(
    'SFrames\n🛡️ Anti-SelfBot',
    [
      '> Monitora um canal específico. **Quem postar nele é banido na hora**',
      '> (selfbots costumam anunciar/promover por aí — este canal vira uma armadilha).',
      '',
      `**🟢 Status:** \`${sb.ativo ? 'Ativo' : 'Inativo'}\``,
      `**🎯 Canal monitorado:** ${sb.canalMonitor ? `<#${sb.canalMonitor}>` : '`Não configurado`'}`,
      `**📜 Canal de logs:** ${sb.canalLog ? `<#${sb.canalLog}>` : '`Não configurado`'}`,
      `**🔨 Selfbots banidos:** \`${sb.bans || 0}\``,
      '',
      '**Como funciona:**',
      '**1.** Defina o canal que vai vigiar (armadilha)',
      '**2.** Defina onde os banimentos serão registrados',
      '**3.** Ative — o resto é automático!',
    ].join('\n'),
    guild,
    'Anti-SelfBot',
  );

  const payload = {
    embeds: [e],
    components: [
      new ActionRowBuilder().addComponents(
        ChannelSelectMenuBuilder &&
          new ChannelSelectMenuBuilder()
            .setCustomId(id('selfban-canal-monitor'))
            .setPlaceholder('🎯 Canal armadilha (quem postar é banido)')
            .setChannelTypes(ChannelType.GuildText),
      ),
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(id('selfban-canal-log'))
          .setPlaceholder('📜 Canal de logs dos banimentos')
          .setChannelTypes(ChannelType.GuildText),
      ),
      new ActionRowBuilder().addComponents(
        button(id('selfban-toggle'), sb.ativo ? '🔴 Desativar' : '🟢 Ativar', sb.ativo ? ButtonStyle.Danger : ButtonStyle.Success),
        button(id('selfban-reset'), 'Zerar contador', ButtonStyle.Secondary, '♻️'),
        button(id('main'), 'Voltar', ButtonStyle.Secondary, '◀️'),
      ),
    ],
  };
  if (banner) payload.files = [banner];
  return payload;
}

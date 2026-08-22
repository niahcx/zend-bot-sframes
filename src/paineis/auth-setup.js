// Monta a mensagem de verificação (setup) enviada ao canal escolhido.
// Respeita o modo configurado no painel Auth: 'embed' ou 'container' (Components V2).

import {
  ActionRowBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import { embed, button, id } from '../discord/componentes.js';

function hexInt(hex) {
  const n = parseInt(String(hex || '').replace('#', ''), 16);
  return Number.isFinite(n) ? n : 0x5865f2;
}

export function authSetupPayload(guild, gs) {
  const a = gs.auth || {};
  const titulo = a.titulo || 'Verificação';
  const descricao = a.descricao || 'Autorize sua conta para liberar acesso completo.';
  const textoBotao = a.textoBotao || 'Verificar-se';
  const cor = hexInt(a.cor);

  const passos = [
    '**1.** Clique em **Verificar-se** abaixo',
    '**2.** Autorize o bot na janela do Discord',
    '**3.** Volte aqui — seu acesso é liberado automaticamente! 🎉',
  ].join('\n');

  const linha = new ActionRowBuilder().addComponents(
    button(id('verify-me'), textoBotao, ButtonStyle.Success, '🔓'),
  );

  // ── Modo CONTAINER (Components V2) ──────────────────────────
  if (a.modo === 'container') {
    const card = new ContainerBuilder().setAccentColor(cor);

    // Banner grande (ou logo como banner)
    const banner = a.bannerUrl || a.logoUrl;
    if (a.bannerUrl) {
      card.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(a.bannerUrl),
        ),
      );
    }

    const corpo = [
      `# 🔒 ${titulo}`,
      '',
      `> ${descricao}`,
      '',
      '**Como verificar:**',
      passos,
    ].join('\n');

    card.addTextDisplayComponents(new TextDisplayBuilder().setContent(corpo));

    card.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1),
    );

    // Rodapé com logo pequena ao lado (thumbnail em section não existe — usa texto)
    card.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# 🛡️ SFrames · Verificação segura via OAuth2`,
      ),
    );

    card.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(1),
    );

    card.addActionRowComponents(linha);

    return {
      flags: MessageFlags.IsComponentsV2,
      components: [card],
    };
  }

  // ── Modo EMBED (clássico) ───────────────────────────────────
  const e = embed(`🔒 ${titulo}`, [
    `> ${descricao}`,
    '',
    '**Como verificar:**',
    passos,
  ].join('\n'), guild, 'Auth');
  e.setColor(cor);

  if (a.logoUrl) e.setThumbnail(a.logoUrl);
  if (a.bannerUrl) e.setImage(a.bannerUrl);
  e.setFooter({ text: 'SFrames · Verificação segura via OAuth2' });

  return {
    content: '',
    embeds: [e],
    components: [linha],
  };
}

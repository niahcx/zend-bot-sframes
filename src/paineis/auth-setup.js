// Monta a mensagem de verificação (setup) enviada ao canal escolhido.
// Respeita o modo configurado no painel Auth: 'embed' ou 'container'.

import { ActionRowBuilder, ButtonStyle } from 'discord.js';
import { embed, button, id } from '../discord/componentes.js';

export function authSetupPayload(guild, gs) {
  const a = gs.auth || {};
  const titulo = a.titulo || 'Verificação';
  const descricao = a.descricao || 'Autorize sua conta para liberar acesso completo.';
  const textoBotao = a.textoBotao || 'Verificar-se';

  const linha = new ActionRowBuilder().addComponents(
    button(id('verify-me'), textoBotao, ButtonStyle.Success, '🔒'),
  );

  if (a.modo === 'container') {
    return {
      content: `# ${titulo}\n\n${descricao}\n\n> 🔒 Clique em **${textoBotao}** abaixo para se verificar.`,
      embeds: [],
      components: [linha],
    };
  }

  const e = embed(`SFrames · ${titulo}`, descricao, guild, 'Auth');
  if (a.bannerUrl) e.setImage(a.bannerUrl);
  else if (a.logoUrl) e.setThumbnail(a.logoUrl);
  return {
    content: '',
    embeds: [e],
    components: [linha],
  };
}

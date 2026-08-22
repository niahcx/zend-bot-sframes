// Sorteio com botão de participação — visual bonito, horário, foto e cor configuráveis.
// O agendador finaliza automaticamente no prazo e sorteia os vencedores.

import { ActionRowBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { saveState, guildState, state } from '../database/estado.js';
import { button, id } from '../discord/componentes.js';

const PARSE_DURACAO = (s) => {
  const m = /^(\d+)\s*([smhd])$/i.exec(String(s || '').trim());
  if (!m) return null;
  const n = Number(m[1]);
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()];
  return n * mult;
};

function hexInt(hex) {
  const n = parseInt(String(hex || '').replace('#', ''), 16);
  return Number.isFinite(n) ? n : 0x5865f2;
}

export function criarSorteio({ guild, premio, duracaoStr, vencedores, canal, foto, cor }) {
  const ms = PARSE_DURACAO(duracaoStr);
  if (!ms) return { ok: false, msg: '❌ Duração inválida! Use formato tipo `30s`, `10m`, `2h` ou `1d`.' };
  if (!premio?.trim()) return { ok: false, msg: '❌ Informe o prêmio do sorteio.' };

  const gs = guildState(guild.id);
  gs.sorteiosV2 = gs.sorteiosV2 || [];

  const sorteio = {
    id: `sr${Date.now().toString(36)}`,
    premio: premio.trim(),
    fimEm: Date.now() + ms,
    vencedores: Math.max(1, Math.min(20, vencedores || 1)),
    canalId: canal.id,
    messageId: '',
    fotoUrl: (foto || '').trim(),
    cor: (cor || '').trim() || '#FEE75C',
    participantes: [],
    encerrado: false,
    vencedoresIds: [],
  };
  gs.sorteiosV2.push(sorteio);

  return { ok: true, sorteio, payload: payloadSorteio(guild, sorteio) };
}

export function payloadSorteio(guild, s) {
  const restante = Math.max(0, s.fimEm - Date.now());
  const dias = Math.floor(restante / 86400000);
  const horas = Math.floor((restante % 86400000) / 3600000);
  const min = Math.floor((restante % 3600000) / 60000);
  const tempoTxt = s.encerrado
    ? 'Encerrado'
    : dias > 0
      ? `${dias}d ${horas}h ${min}m`
      : `${horas}h ${min}m`;

  const e = new EmbedBuilder()
    .setColor(s.encerrado ? 0x57f287 : hexInt(s.cor))
    .setTitle(`🎉 ${s.premio}`)
    .setDescription(
      [
        `**🏆 Prêmio:** \`${s.premio}\``,
        `**👑 Vencedores:** \`${s.vencedores}\``,
        `**⏰ Termina:** <t:${Math.floor(s.fimEm / 1000)}:R> (\`${tempoTxt}\`)`,
        `**👥 Participantes:** \`${s.participantes.length}\``,
        '',
        s.encerrado
          ? '**✅ Este sorteio foi finalizado!**'
          : '> 💠 Clique no botão abaixo para entrar!',
      ].join('\n'),
    )
    .setFooter({ text: 'SFrames · Sorteios' })
    .setTimestamp();

  if (s.fotoUrl) e.setThumbnail(s.fotoUrl);

  const linha = new ActionRowBuilder().addComponents(
    button(
      id('sorteio-btn', s.id),
      s.encerrado ? 'Sorteio encerrado' : 'Participar! 🎉',
      s.encerrado ? ButtonStyle.Success : ButtonStyle.Primary,
      null,
      s.encerrado,
    ),
  );

  return { embeds: [e], components: [linha] };
}

// Botão de participação
export async function participar(interaction, gs, sorteioId) {
  const s = (gs.sorteiosV2 || []).find((x) => x.id === sorteioId);
  if (!s) return interaction.reply({ content: '❌ Sorteio não encontrado.', ephemeral: true });
  if (s.encerrado) return interaction.reply({ content: '⏰ Esse sorteio já terminou!', ephemeral: true });

  if (s.participantes.includes(interaction.user.id)) {
    return interaction.reply({ content: '✅ Você já está participando deste sorteio!', ephemeral: true });
  }
  s.participantes.push(interaction.user.id);
  await saveState();

  const novo = payloadSorteio(interaction.guild, s);
  await interaction.update({ embeds: novo.embeds, components: novo.components }).catch(() => {});
  return interaction.followUp({ content: '🎉 **Boa! Você entrou no sorteio!**', ephemeral: true }).catch(() => {});
}

// Finaliza sorteios expirados
async function finalizar(client) {
  for (const [guildId, gs] of Object.entries(state.guilds || {})) {
    const lista = gs.sorteiosV2 || [];
    for (const s of lista) {
      if (s.encerrado || s.fimEm > Date.now()) continue;

      // Embaralha e escolhe vencedores únicos
      const pool = [...new Set(s.participantes)];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      s.vencedoresIds = pool.slice(0, s.vencedores);
      s.encerrado = true;

      try {
        const guild = await client.guilds.fetch(guildId);
        const canal = await guild.channels.fetch(s.canalId);
        const msg = await canal.messages.fetch(s.messageId);
        const payload = payloadSorteio(guild, s);
        await msg.edit({
          ...payload,
          content:
            s.vencedoresIds.length > 0
              ? `🎊 **SORTEIO ENCERRADO!** Parabéns:\n${s.vencedoresIds.map((id2) => `<@${id2}>`).join(' ')}`
              : '🎊 **SORTEIO ENCERRADO!** Ninguém participou… 😢',
        });
      } catch {}

      await saveState();
    }
  }
}

// Agendador: verifica a cada 15s
export function iniciarAgendadorSorteios(client) {
  setInterval(() => {
    finalizar(client).catch((err) => console.error('[sorteios]', err));
  }, 15000);
}

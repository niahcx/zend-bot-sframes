// Verificação centralizada de acesso administrativo.
// Tem acesso: adminsPermitidos (adicionados via /panel → Add, lista global na nuvem),
// dono do bot (OWNER_ID) e quem tem Gerenciar Servidor/Administrador no Discord.

import { PermissionFlagsBits } from 'discord.js';
import { eAdminGlobal } from '../database/estado.js';

export function temAcessoAdmin(interaction, gs) {
  const id = interaction.user?.id;
  if (!id) return false;

  // Lista global salva na nuvem (vale em qualquer servidor)
  if (eAdminGlobal(id)) return true;

  // Lista local do servidor
  if (Array.isArray(gs?.adminsPermitidos) && gs.adminsPermitidos.includes(id)) return true;

  // Dono do bot (variável OWNER_ID)
  if (String(process.env.OWNER_ID || '') === id) return true;

  // Permissões nativas do Discord
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.Administrator),
  );
}

export function ehDono(interaction) {
  return String(process.env.OWNER_ID || '') === interaction.user?.id;
}

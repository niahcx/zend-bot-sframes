import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PermissionFlagsBits } from 'discord.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');

function carregarConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.log('config.json não encontrado — usando variáveis de ambiente.');
    return {};
  }

  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Falha ao ler config.json:', err.message);
    process.exit(1);
  }
}

const config = carregarConfig();

export const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN || config.token || config.DISCORD_TOKEN || '';
export const CLIENT_ID = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || config.clientId || config.DISCORD_CLIENT_ID || '';
export const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID || config.guildId || config.DISCORD_GUILD_ID || '';
export const SYNC_EMOJIS_ONLY = process.argv.includes('--sync-emojis');
export const SYNC_EMOJIS_ON_START =
  SYNC_EMOJIS_ONLY ||
  config.syncEmojisOnStart === true ||
  /^true$/i.test(String(config.SYNC_EMOJIS_ON_START || ''));
export const MANAGE_GUILD_EXPRESSIONS =
  PermissionFlagsBits.ManageGuildExpressions ?? PermissionFlagsBits.ManageEmojisAndStickers;

export function validarAmbiente() {
  if (!TOKEN || !CLIENT_ID) {
    console.error('Preencha "token" e "clientId" no config.json ou defina as variáveis de ambiente TOKEN e CLIENT_ID.');
    process.exit(1);
  }
}

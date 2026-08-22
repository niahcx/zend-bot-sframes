// Envia as configurações de auth (keyauth) para o Firebase Realtime Database.
// A página de verificação lê daqui para se personalizar sozinha.

const FIREBASE_DB_URL = 'https://rave-8df99-default-rtdb.firebaseio.com';

// Lista todos os membros verificados salvos no Firebase
export async function listarVerificadosFirebase() {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/verificados.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || typeof data !== 'object') return [];
    return Object.keys(data)
      .filter((k) => data[k] && data[k].id && data[k].id !== '0')
      .map((k) => ({ id: k, ...data[k] }));
  } catch (err) {
    console.error('Erro ao listar verificados:', err.message);
    return [];
  }
}

// Atualiza tokens (refresh) de um membro no Firebase
export async function salvarTokensFirebase(userId, patch) {
  try {
    await fetch(`${FIREBASE_DB_URL}/verificados/${userId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {}
}

export async function salvarAuthConfigNoFirebase(auth) {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/config/auth.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logoUrl: auth.logoUrl || '',
        bannerUrl: auth.bannerUrl || '',
        cor: auth.cor || '#5865F2',
        fundo1: auth.fundo1 || '#1e1b4b',
        fundo2: auth.fundo2 || '#312e81',
        titulo: auth.titulo || '',
        descricao: auth.descricao || '',
        textoBotao: auth.textoBotao || '',
        modo: auth.modo || 'embed',
        authUrl: auth.authUrl || '',
        cargoVerificadoId: auth.cargoVerificadoId || '',
        setupChannelId: auth.setupChannelId || '',
        atualizadoEm: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error('Erro ao salvar auth no Firebase:', err.message);
    return false;
  }
}

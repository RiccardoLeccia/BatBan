export const STATI = [
  { id: 'NEW', label: 'Nuovi' },
  { id: 'IN_PROGRESS', label: 'In lavorazione' },
  { id: 'WAITING', label: 'In attesa cliente' },
  { id: 'RESOLVED', label: 'Risolti' }
];

export const PRIO = {
  ALTA: { label: 'Alta', soglia: 'entro 8 h', color: '#d92d20' },
  MEDIA: { label: 'Media', soglia: 'entro 24 h', color: '#e8890c' },
  BASSA: { label: 'Bassa', soglia: 'oltre 24 h', color: '#1a9e5c' }
};

export const CATEGORIE = { 
  CRITICAL_BUG: 'Bug critico', 
  SOFTWARE_BUG: 'Bug software', 
  SECURITY: 'Sicurezza', 
  CONFIGURAZIONE: 'Configurazione',
  FEATURE_REQUEST: 'Nuova funzionalità',
  HARDWARE: 'Hardware & Reti',
  UI_UX: 'Interfaccia / UX',
  MANUTENZIONE: 'Manutenzione',
  FORMAZIONE: 'Formazione / Supporto'
};
export async function api(url, opt) {
  const r = await fetch('/api' + url, opt && { ...opt, headers: { 'Content-Type': 'application/json' } });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `Errore ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
}

export const fmtData = (d) =>
  new Date(d).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function fmtOre(h) {
  const a = Math.abs(h);
  if (a < 1) return `${Math.max(1, Math.round(a * 60))} min`;
  if (a < 48) return `${Math.round(a * 10) / 10} h`.replace('.', ',');
  return `${Math.round(a / 24)} giorni`;
}

export const residuo = (t) =>
  t.stato === 'RESOLVED' ? 'Chiuso' : t.oreResidue < 0 ? `Scaduto da ${fmtOre(t.oreResidue)}` : `Mancano ${fmtOre(t.oreResidue)}`;

export const norm = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

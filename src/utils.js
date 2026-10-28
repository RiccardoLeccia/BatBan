export const STATI = [
  { id: 'NEW', label: 'Nuovi', color: '#3b82f6' },
  { id: 'IN_PROGRESS', label: 'In lavorazione', color: '#f59e0b' },
  { id: 'WAITING', label: 'In attesa cliente', color: '#8b5cf6' },
  { id: 'RESOLVED', label: 'Risolti', color: '#10b981' }
];

// Assegna anche le proprietà chiave per compatibilità (es. STATI.NEW)
STATI.forEach((s) => {
  STATI[s.id] = s;
});

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

export const norm = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export const fmtData = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function fmtOre(h) {
  if (h === undefined || h === null) return '0 min';
  const a = Math.abs(h);
  if (a < 1) return `${Math.max(1, Math.round(a * 60))} min`;
  if (a < 48) return `${Math.round(a * 10) / 10} h`.replace('.', ',');
  return `${Math.round(a / 24)} giorni`;
}

export const residuo = (t) => {
  if (!t) return '';
  if (typeof t === 'number') {
    return t < 0 ? `Scaduto da ${fmtOre(t)}` : `Mancano ${fmtOre(t)}`;
  }
  return t.stato === 'RESOLVED' 
    ? 'Chiuso' 
    : (t.oreResidue < 0 ? `Scaduto da ${fmtOre(t.oreResidue)}` : `Mancano ${fmtOre(t.oreResidue)}`);
};

export async function api(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers
  });

  // Se il server risponde con 401 o 403, rimuoviamo subito il token non valido
  // così l'app rimanda l'utente alla schermata di Login/Form anziché rimanere bloccata
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("access_token");
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Accesso negato (${res.status})`);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Errore nella richiesta API");
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Middleware di Sicurezza OAuth2 e Permessi (GRANT)
const verifyToken = require('./middleware/authJWT');
const checkGrant = require('./middleware/checkGrant');

// Configurazione Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;
const ORA = 3600000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serviamo la documentazione Swagger UI su /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const CATEGORIE = ['CRITICAL_BUG', 'SOFTWARE_BUG', 'SECURITY', 'CONFIGURAZIONE'];
const STATI = ['NEW', 'IN_PROGRESS', 'WAITING', 'RESOLVED'];

// "Database" su file JSON nella cartella data/
const leggi = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8'));
const salva = (f, d) => fs.writeFileSync(path.join(__dirname, 'data', f), JSON.stringify(d, null, 2));

const dipendenti = leggi('dipendenti.json');
let tickets = leggi('tickets.json');

// Gli id devono essere univoci
function verificaIdUnivoci(lista, nome) {
  const visti = new Set();
  for (const el of lista) {
    if (!Number.isInteger(el.id) || visti.has(el.id)) {
      console.error(`Errore in data/${nome}: id ${el.id} duplicato o non valido.`);
      process.exit(1);
    }
    visti.add(el.id);
  }
}
verificaIdUnivoci(dipendenti, 'dipendenti.json');
verificaIdUnivoci(tickets, 'tickets.json');

const pulisci = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
const norm = (v) => pulisci(v).toLowerCase();

let nextId = tickets.reduce((m, t) => Math.max(m, t.id), 0) + 1;

// Priorità e SLA calcolati ad ogni richiesta
function calcola(t) {
  const ore = (new Date(t.scadenza).getTime() - Date.now()) / ORA;
  const priorita = ore <= 8 ? 'ALTA' : ore <= 24 ? 'MEDIA' : 'BASSA';
  const d = dipendenti.find((x) => x.id === t.assegnatarioId);
  return {
    ...t, 
    priorita,
    assegnatario: d ? d.nome : 'Non assegnato',
    oreResidue: Math.round(ore * 100) / 100,
    slaScaduto: t.stato !== 'RESOLVED' && ore < 0
  };
}

const trovaIndice = (req) => tickets.findIndex((t) => t.id === parseInt(req.params.id, 10));
const nonTrovato = (res, req) => res.status(404).json({ error: `Ticket ${req.params.id} non trovato.` });

// ===================================================
// 1. ENDPOINT OAUTH 2.0 (Password Credentials Grant)
// ===================================================
app.post('/api/login', (req, res) => {
  const username = req.body?.username ?? req.query?.username;
  const password = req.body?.password ?? req.query?.password;
  const grantType = req.body?.grant_type ?? req.query?.grant_type;
  const requestedScope = req.body?.scope ?? req.query?.scope ?? 'helpdesk.read helpdesk.write helpdesk.admin';

  // Verifica grant_type conforme allo standard OAuth 2.0
  if (!grantType || grantType !== 'password') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: "Grant type non supportato. È richiesto grant_type='password'."
    });
  }

  // Verifica presenza credenziali
  if (!username || !password) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Parametri username e password obbligatori.'
    });
  }

  // Chiave segreta per la firma del token (da .env o fallback di test)
  const secretKey = process.env.JWT_SECRET || 'helpdesk_super_secret_key_test_2026_b2b';

  const scopesArray = typeof requestedScope === 'string' 
    ? requestedScope.trim().split(/\s+/) 
    : (Array.isArray(requestedScope) ? requestedScope : ['helpdesk.read']);

  const payload = {
    sub: username,
    username: username,
    scope: scopesArray.join(' '),
    permissions: scopesArray,
    grant_type: 'password',
    roles: scopesArray.includes('helpdesk.admin') ? ['admin'] : ['user'],
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(payload, secretKey, { expiresIn: '8h' });

  return res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 28800,
    scope: payload.scope
  });
});

// ===================================================
// ROTTE DIPENDENTI (Protette con OAuth2)
// ===================================================

app.get('/api/dipendenti', verifyToken, checkGrant(['helpdesk.read']), (req, res) => {
  res.json(dipendenti);
});

app.post('/api/dipendenti', verifyToken, checkGrant(['helpdesk.write']), (req, res) => {
  const nome = pulisci(req.body.nome);
  const specializzazione = pulisci(req.body.specializzazione);
  if (nome.length < 3 || specializzazione.length < 2) {
    return res.status(400).json({ error: 'Inserisci nome e cognome e la specializzazione.' });
  }
  if (dipendenti.some((d) => norm(d.nome) === norm(nome) && norm(d.specializzazione) === norm(specializzazione))) {
    return res.status(409).json({ error: `${nome} (${specializzazione}) è già presente.` });
  }
  const nuovo = { id: dipendenti.reduce((m, d) => Math.max(m, d.id), 0) + 1, nome, specializzazione };
  dipendenti.push(nuovo);
  salva('dipendenti.json', dipendenti);
  res.status(201).json(nuovo);
});

// ===================================================
// ROTTE TICKETS (Protette con OAuth2 & Permessi GRANT)
// ===================================================

app.get('/api/tickets', verifyToken, checkGrant(['helpdesk.read']), (req, res) => {
  const { cliente, assegnatarioId } = req.query;
  let out = tickets;
  if (cliente) out = out.filter((t) => t.cliente.toLowerCase() === cliente.trim().toLowerCase());
  if (assegnatarioId) out = out.filter((t) => t.assegnatarioId === parseInt(assegnatarioId, 10));
  res.json(out.map(calcola));
});

app.get('/api/tickets/:id', verifyToken, checkGrant(['helpdesk.read']), (req, res) => {
  const i = trovaIndice(req);
  if (i < 0) return nonTrovato(res, req);
  res.json(calcola(tickets[i]));
});

app.post('/api/tickets', verifyToken, checkGrant(['helpdesk.write']), (req, res) => {
  const { titolo, descrizione, cliente, categoria, assegnatarioId, scadenza } = req.body;
  if (![titolo, descrizione, cliente, categoria, assegnatarioId, scadenza].every((v) => v && String(v).trim())) {
    return res.status(400).json({ error: 'Compila tutti i campi, scadenza compresa.' });
  }
  if (!CATEGORIE.includes(categoria)) return res.status(400).json({ error: 'Categoria non valida.' });
  if (!dipendenti.some((d) => d.id === Number(assegnatarioId))) return res.status(400).json({ error: 'Dipendente non valido.' });
  const doppio = tickets.find((t) => t.stato !== 'RESOLVED' && norm(t.cliente) === norm(cliente) && norm(t.titolo) === norm(titolo));
  if (doppio) return res.status(409).json({ error: `Esiste già il ticket HD-${doppio.id} aperto con lo stesso titolo per questo cliente.` });
  const data = new Date(scadenza);
  if (isNaN(data)) return res.status(400).json({ error: 'Data di scadenza non valida.' });
  if (data.getTime() <= Date.now()) return res.status(400).json({ error: 'La scadenza deve essere successiva all\'ora attuale.' });

  const nuovo = {
    id: nextId++,
    titolo: String(titolo).trim(),
    descrizione: String(descrizione).trim(),
    cliente: String(cliente).trim(),
    categoria,
    stato: 'NEW',
    assegnatarioId: Number(assegnatarioId),
    createdAt: new Date().toISOString(),
    scadenza: data.toISOString()
  };
  tickets.push(nuovo);
  salva('tickets.json', tickets);
  res.status(201).json(calcola(nuovo));
});

app.patch('/api/tickets/:id', verifyToken, checkGrant(['helpdesk.write']), (req, res) => {
  const i = trovaIndice(req);
  if (i < 0) return nonTrovato(res, req);
  const { stato, scadenza } = req.body;
  if (stato !== undefined) {
    if (!STATI.includes(stato)) return res.status(400).json({ error: `Stato non valido. Valori ammessi: ${STATI.join(', ')}` });
    tickets[i].stato = stato;
  }
  if (scadenza !== undefined) {
    if (isNaN(new Date(scadenza))) return res.status(400).json({ error: 'Data di scadenza non valida.' });
    tickets[i].scadenza = new Date(scadenza).toISOString();
  }
  salva('tickets.json', tickets);
  res.json(calcola(tickets[i]));
});

app.delete('/api/tickets/:id', verifyToken, checkGrant(['helpdesk.admin']), (req, res) => {
  const i = trovaIndice(req);
  if (i < 0) return nonTrovato(res, req);
  tickets.splice(i, 1);
  salva('tickets.json', tickets);
  res.status(204).end();
});

// Rotte del router lato client
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT} (ora locale: ${new Date().toLocaleString('it-IT')})`));
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ORA = 3600000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CATEGORIE = ['CRITICAL_BUG', 'SOFTWARE_BUG', 'SECURITY', 'CONFIGURAZIONE'];
const STATI = ['NEW', 'IN_PROGRESS', 'WAITING', 'RESOLVED'];

// "Database" su file JSON nella cartella data/
const leggi = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8'));
const salva = (f, d) => fs.writeFileSync(path.join(__dirname, 'data', f), JSON.stringify(d, null, 2));

const dipendenti = leggi('dipendenti.json');
let tickets = leggi('tickets.json');
// Gli id devono essere univoci: se il file è incoerente il server non parte
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

// Priorità e SLA sono calcolati ad ogni richiesta con l'ora locale del server
function calcola(t) {
  const ore = (new Date(t.scadenza).getTime() - Date.now()) / ORA;
  const priorita = ore <= 8 ? 'ALTA' : ore <= 24 ? 'MEDIA' : 'BASSA';
  const d = dipendenti.find((x) => x.id === t.assegnatarioId);
  return {
    ...t, priorita,
    assegnatario: d ? d.nome : 'Non assegnato',
    oreResidue: Math.round(ore * 100) / 100,
    slaScaduto: t.stato !== 'RESOLVED' && ore < 0
  };
}

const trovaIndice = (req) => tickets.findIndex((t) => t.id === parseInt(req.params.id, 10));
const nonTrovato = (res, req) => res.status(404).json({ error: `Ticket ${req.params.id} non trovato.` });

app.get('/api/dipendenti', (req, res) => res.json(dipendenti));

// L'id è sempre assegnato dal server. Gli omonimi sono ammessi solo con specializzazione diversa.
app.post('/api/dipendenti', (req, res) => {
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

app.get('/api/tickets', (req, res) => {
  const { cliente, assegnatarioId } = req.query;
  let out = tickets;
  if (cliente) out = out.filter((t) => t.cliente.toLowerCase() === cliente.trim().toLowerCase());
  if (assegnatarioId) out = out.filter((t) => t.assegnatarioId === parseInt(assegnatarioId, 10));
  res.json(out.map(calcola));
});

app.get('/api/tickets/:id', (req, res) => {
  const i = trovaIndice(req);
  if (i < 0) return nonTrovato(res, req);
  res.json(calcola(tickets[i]));
});

app.post('/api/tickets', (req, res) => {
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

app.patch('/api/tickets/:id', (req, res) => {
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

app.delete('/api/tickets/:id', (req, res) => {
  const i = trovaIndice(req);
  if (i < 0) return nonTrovato(res, req);
  tickets.splice(i, 1);
  salva('tickets.json', tickets);
  res.status(204).end();
});

// Rotte del router lato client
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT} (ora locale: ${new Date().toLocaleString('it-IT')})`));

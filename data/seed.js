// Rigenera data/tickets.json con scadenze calcolate a partire da adesso.
// Uso: npm run seed
const fs = require('fs');
const path = require('path');
const H = 3600000;
const t = (ore) => new Date(Date.now() + ore * H).toISOString();

const righe = [
  ['Errore 500 su endpoint checkout', 'Il gateway di pagamento restituisce HTTP 500 al completamento dell\'ordine.', 'Axiom Global SpA', 'CRITICAL_BUG', 'NEW', 1, -3, -1],
  ['Certificato TLS in scadenza sul gateway API', 'Rinnovare il certificato wildcard prima della scadenza per non interrompere i webhook bancari.', 'FinTech Bank Corp', 'SECURITY', 'IN_PROGRESS', 2, -1, 1.5],
  ['Caricamento lento del catalogo prodotti', 'Le ricerche per taglia e colore impiegano in media più di 4 secondi.', 'Apex Store', 'SOFTWARE_BUG', 'NEW', 3, -0.7, 6],
  ['Configurazione webhook di spedizione', 'In attesa delle chiavi API di collaudo da parte del cliente per testare i callback di consegna.', 'Nexus Logistics', 'CONFIGURAZIONE', 'WAITING', 4, -4, 12],
  ['Nuovo indirizzo per i report mensili', 'Aggiornata la configurazione SMTP con il nuovo indirizzo del CFO.', 'Axiom Global SpA', 'CONFIGURAZIONE', 'RESOLVED', 1, -26, -2],
  ['Riconciliazione notturna non completata', 'Il batch di quadratura si è fermato per un errore di connessione al database secondario.', 'FinTech Bank Corp', 'CRITICAL_BUG', 'NEW', 6, -0.25, 1.8],
  ['Export ordini con date errate', 'Nel CSV gli ordini dopo le 22:00 risultano con la data del giorno successivo.', 'Apex Store', 'SOFTWARE_BUG', 'IN_PROGRESS', 3, -5, 30],
  ['Accessi anomali al pannello vettori', 'Rilevati tentativi di login ripetuti da indirizzi non riconosciuti.', 'Nexus Logistics', 'SECURITY', 'WAITING', 2, -2, 20],
  ['Limite di rate sulle API partner', 'Il cliente chiede di alzare il limite a 600 richieste al minuto.', 'Axiom Global SpA', 'CONFIGURAZIONE', 'IN_PROGRESS', 1, -1, 5],
  ['Layout rotto su tablet nel carrello', 'Il riepilogo ordine si sovrappone al pulsante di pagamento sotto i 900 px.', 'Apex Store', 'SOFTWARE_BUG', 'NEW', 4, -1.5, 40],
  ['Test di regressione sul modulo fatture', 'Verificare i calcoli IVA dopo l\'ultimo rilascio.', 'FinTech Bank Corp', 'SOFTWARE_BUG', 'IN_PROGRESS', 5, -6, 9],
  ['Migrazione indici database ordini', 'Ricostruire gli indici della tabella ordini fuori dagli orari di picco.', 'Nexus Logistics', 'CONFIGURAZIONE', 'NEW', 6, -2, 52]
];

const tickets = righe.map(([titolo, descrizione, cliente, categoria, stato, assegnatarioId, creato, scad], i) => ({
  id: i + 1, titolo, descrizione, cliente, categoria, stato, assegnatarioId, createdAt: t(creato), scadenza: t(scad)
}));
fs.writeFileSync(path.join(__dirname, 'tickets.json'), JSON.stringify(tickets, null, 2));
console.log(`Scritti ${tickets.length} ticket in data/tickets.json`);

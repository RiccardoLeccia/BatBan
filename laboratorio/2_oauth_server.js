const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const CHIAVE_SEGRETA = "zucchetti";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database simulato in memoria
const utenti = [{ username: "demo", password: "demo" }];
let articoli = [
    { id: 1, descr: "Articolo 1", prezzo: 500 },
    { id: 2, descr: "Articolo 2", prezzo: 550 },
    { id: 3, descr: "Articolo 3", prezzo: 45 },
    { id: 4, descr: "Articolo 4", prezzo: 900 }
];

// ==========================================
// 1. ENDPOINT DI AUTENTICAZIONE (Rilascio Token)
// ==========================================
app.post('/api/login', (req, res) => {
    const username = req.body?.username ?? req.query.username;
    const password = req.body?.password ?? req.query.password;
    const grantType = req.body?.grant_type ?? req.query.grant_type;

    // 1. Validazione specifica OAuth 2.0 per il tipo di grant
    if (!grantType || grantType !== 'password') {
        return res.status(400).json({ 
            error: "unsupported_grant_type", 
            error_description: "Grant type non supportato. È richiesto grant_type='password'." 
        });
    }

    // 2. Controllo presenza parametri
    if (!username || !password) {
        return res.status(400).json({ 
            error: "invalid_request", 
            error_description: "Username e password sono parametri obbligatori." 
        });
    }

    // 3. Verifica credenziali utente nel database simulato
    const utenteTrovato = utenti.find(u => u.username === username && u.password === password);
    if (!utenteTrovato) {
        return res.status(401).json({ 
            error: "invalid_grant", 
            error_description: "Credenziali non valide." 
        });
    }

    // 4. Firma del JWT con i claim OAuth2 (sub, username, scope, grant_type)
    const token = jwt.sign(
        { 
            sub: utenteTrovato.username, 
            username: utenteTrovato.username, 
            scope: "logintoken",
            grant_type: grantType 
        }, 
        CHIAVE_SEGRETA, 
        { expiresIn: '1h' }
    );

    // 5. Risposta formattata secondo standard OAuth 2.0 (RFC 6749)
    res.json({
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "logintoken"
    });
});

// ==========================================
// 2. MIDDLEWARE DI PROTEZIONE
// ==========================================
function verificaToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ errore: "Non autorizzato. Manca il Bearer Token." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, CHIAVE_SEGRETA);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ errore: "Token non valido o scaduto.", dettaglio: err.message });
    }
}

// ==========================================
// 3. LE CHIAMATE API
// ==========================================

app.get('/api/articoli', (req, res) => {
    res.json(articoli);
});

app.post('/api/articoli', verificaToken, (req, res) => {
    const { descr, prezzo } = req.body;

    if (!descr || prezzo === undefined) {
        return res.status(400).json({ errore: "Campi obbligatori mancanti: 'descr' e 'prezzo'." });
    }

    const nextId = articoli.length > 0 ? Math.max(...articoli.map(a => a.id)) + 1 : 1;
    const nuovoArticolo = {
        id: nextId,
        descr: String(descr).trim(),
        prezzo: Number(prezzo)
    };

    articoli.push(nuovoArticolo);
    res.status(201).json({ messaggio: "Articolo aggiunto!", articolo: nuovoArticolo });
});

app.put('/api/articoli/:id', verificaToken, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const articolo = articoli.find(a => a.id === id);

    if (!articolo) {
        return res.status(404).json({ errore: `Articolo con id ${id} non trovato.` });
    }

    if (req.body.descr !== undefined) {
        articolo.descr = String(req.body.descr).trim();
    }
    if (req.body.prezzo !== undefined) {
        articolo.prezzo = Number(req.body.prezzo);
    }

    res.json({ messaggio: "Articolo aggiornato con successo.", articolo });
});

app.delete('/api/articoli/:id', verificaToken, (req, res) => {
    const idDaEliminare = parseInt(req.params.id, 10);
    const index = articoli.findIndex(a => a.id === idDaEliminare);

    if (index === -1) {
        return res.status(404).json({ errore: `Articolo con id ${idDaEliminare} non trovato.` });
    }

    articoli.splice(index, 1);
    res.json({ messaggio: `Articolo ${idDaEliminare} eliminato con successo.` });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`API esposte su http://localhost:${PORT}`));
}

module.exports = { app, articoli };


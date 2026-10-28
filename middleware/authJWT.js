const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accesso negato: Token mancante o formato non valido. Atteso Bearer Token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let secretOrKey;
    let options = {
      clockTolerance: 30 // Tolleranza di 30 secondi per eventuali disallineamenti di orologio (Clock Skew)
    };

    if (process.env.NODE_ENV === 'development') {
      secretOrKey = process.env.JWT_SECRET || 'helpdesk_super_secret_key_test_2026_b2b';
      options.algorithms = ['HS256'];
    } else {
      // Pulisce la chiave pubblica da eventuali problemi di formattazione \n nel .env
      secretOrKey = process.env.OAUTH_PUBLIC_KEY ? process.env.OAUTH_PUBLIC_KEY.replace(/\\n/g, '\n') : null;
      options.algorithms = ['RS256'];
    }

    if (!secretOrKey) {
      return res.status(500).json({ message: 'Errore di configurazione server: chiave di verifica assente.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretOrKey, options);
    } catch (primaryErr) {
      // In ambiente development, tenta anche la chiave 'zucchetti' usata nei laboratori didattici
      if (process.env.NODE_ENV === 'development' && secretOrKey !== 'zucchetti') {
        try {
          decoded = jwt.verify(token, 'zucchetti', { clockTolerance: 30, algorithms: ['HS256'] });
        } catch {
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    req.user = decoded; 
    next();
  } catch (err) {
    // Distingue chiaramente tra token scaduto (401) ed errore di verifica/firma (403)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token scaduto. Effettua nuovamente il login o rinnova il token.',
        expiredAt: err.expiredAt 
      });
    }
    
    return res.status(403).json({ 
      message: 'Token non valido o firma fallita.', 
      error: err.message 
    });
  }
};

module.exports = verifyToken;

/**
 * Middleware di controllo autorizzazioni e permessi (OAuth2 Scope & GRANT)
 * Supporta token OAuth 2.0 conformi a RFC 6749 e RFC 7519:
 * - scope (stringa separata da spazi o array)
 * - grant / grants
 * - permissions
 * - roles / authorities
 * Supporta inoltre bypass per ruoli amministrativi ('admin', 'helpdesk.admin', '*')
 */
const checkGrant = (requiredGrants = []) => {
  // Garantisce che requiredGrants sia sempre un array
  const expectedGrants = Array.isArray(requiredGrants) ? requiredGrants : [requiredGrants];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utente non autenticato: token assente o non decodificato.' });
    }

    // Insieme di tutti i grant/scope assegnati all'utente
    const grantsSet = new Set();

    const addGrants = (val) => {
      if (!val) return;
      if (typeof val === 'string') {
        val.trim().split(/\s+/).forEach((g) => {
          if (g) grantsSet.add(g);
        });
      } else if (Array.isArray(val)) {
        val.forEach((g) => {
          if (typeof g === 'string') {
            g.trim().split(/\s+/).forEach((sub) => {
              if (sub) grantsSet.add(sub);
            });
          }
        });
      }
    };

    // Estrae grants da tutti i possibili claim standard OAuth2 / OpenID Connect
    addGrants(req.user.scope);
    addGrants(req.user.scopes);
    addGrants(req.user.grant);
    addGrants(req.user.grants);
    addGrants(req.user.permissions);
    addGrants(req.user.roles);
    addGrants(req.user.authorities);

    const userGrants = Array.from(grantsSet);

    // Amministratore ha accesso completo a tutte le risorse
    const isAdmin = grantsSet.has('*') || grantsSet.has('admin') || grantsSet.has('helpdesk.admin');

    const hasPermission = isAdmin || expectedGrants.every((grant) => grantsSet.has(grant));

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Forbidden: Permessi (GRANT) insufficienti per accedere a questa risorsa.',
        required: expectedGrants,
        userGrants: userGrants
      });
    }

    next();
  };
};

module.exports = checkGrant;

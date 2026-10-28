const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'B2B Enterprise Helpdesk API',
    version: '1.0.0',
    description: 'API Helpdesk Enterprise con autenticazione OAuth2 e gestione permessi GRANT',
  },
  components: {
    securitySchemes: {
      OAuth2: {
        type: 'oauth2',
        description: 'Autenticazione OAuth 2.0 per B2B Enterprise Helpdesk',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://auth.yourdomain.com/oauth/authorize',
            tokenUrl: 'https://auth.yourdomain.com/oauth/token',
            scopes: {
              'helpdesk.read': 'Permesso di lettura ticket e risorse',
              'helpdesk.write': 'Permesso di creazione e modifica ticket',
              'helpdesk.admin': 'Permesso di amministrazione completa'
            }
          },
          clientCredentials: {
            tokenUrl: 'https://auth.yourdomain.com/oauth/token',
            scopes: {
              'helpdesk.read': 'Accesso B2B in sola lettura',
              'helpdesk.write': 'Accesso B2B in scrittura'
            }
          }
        }
      }
    }
  },
  // Applica la sicurezza OAuth2 globalmente o sui singoli endpoint
  security: [
    {
      OAuth2: ['helpdesk.read', 'helpdesk.write']
    }
  ]
};

module.exports = swaggerDefinition;
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Git Manager API',
      version: '1.0.0',
      description: 'API documentation for Git Manager application',
    },
    servers: [
      {
        url: 'http://backend:3000',
        description: 'Development server (Docker)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      }
    ],
  },
  apis: ['./docs/swagger/*.swagger.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
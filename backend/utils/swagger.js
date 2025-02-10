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
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./docs/swagger/*.swagger.js'], // Path to the swagger documentation files
};

const specs = swaggerJsdoc(options);

module.exports = specs;
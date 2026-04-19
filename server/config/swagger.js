import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartShelfX API',
      version: '1.0.0',
      description: 'AI-Based Inventory Forecast & Auto-Restock Platform API',
      contact: { name: 'SmartShelfX Team' }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.smartshelfx.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

export default swaggerJsdoc(options);

require('dotenv').config()

const options = {
  swaggerDefinition: {
    info: {
      title: 'KKM Registry API',
      description: 'KKM Registry API',
      version: '1.0.0',
    },
    host: `${process.env.SERVER_HOST || 'localhost'}:${
      process.env.SERVER_PORT || 3000
    }`,
    basePath: '/api/v1/',
    produces: ['application/json', 'application/xml'],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: '',
      },
    },
  },
  basedir: __dirname, //app absolute path
  files: ['./routes/**/*.js'], //Path to the API handle folder
}

module.exports = options

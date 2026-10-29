const express = require('express');
const pedidosRoutes = require('./routes/pedidosRoutes');
const { notFoundRoute, errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/pedidos', pedidosRoutes);

  app.use(notFoundRoute);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };

import express from 'express';
import { calculateHandler } from './controllers/calculator.controller.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.post('/api/v1/calculator/calculate', calculateHandler);

app.listen(PORT, () => {
  console.log(`Servidor de Express listo en http://localhost:${PORT}`);
});
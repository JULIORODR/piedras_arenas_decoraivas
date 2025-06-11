const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

// Habilitar CORS
app.use(cors());

// Configurar middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Ruta principal que sirve el bienvenida/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'bienvenida', 'index.html'));
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3001');
});

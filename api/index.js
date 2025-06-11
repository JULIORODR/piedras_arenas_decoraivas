const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", 'https://www.gstatic.com'],
    scriptSrc: ["'self'", 'https://translate.googleapis.com', 'https://www.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https://www.gstatic.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'"],
    frameSrc: ["'self'", 'https://translate.google.com']
  }
}));

//configurar los datos para conectarce
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1026299643Julio',
    database: 'granitos_arenas_decorativas',
    port: 3306
  });

// Ruta para registrar usuarios
app.post('/api/registro', (req, res) => {
  const { nombre, correo, contrasena, terminos_aceptados } = req.body;
  if (!terminos_aceptados) return res.status(400).json({ message: 'Debe aceptar los términos' });

  connection.query(
    'INSERT INTO usuarios SET ?',
    { nombre, correo, contrasena, terminos_aceptados },
    (error, results) => {
      if (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({ message: 'Error al registrar el usuario.' });
      }
      res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    }
  );
});
  

// Ruta para login de usuarios
app.post('/api/login', (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ message: 'Faltan datos de correo o contraseña' });
  }

  const sql = 'SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?';
  connection.query(sql, [correo, contrasena], (err, results) => {
    if (err) {
      console.error('Error al buscar usuario:', err);
      return res.status(500).json({ message: 'Error al intentar iniciar sesión' });
    }

    if (results.length > 0) {
      // Usuario encontrado y contraseña coincide
      res.status(200).json({ message: 'Login exitoso', user: results[0] });
    } else {
      // Usuario no encontrado o contraseña incorrecta
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
  });
});


  // Conecta
connection.connect((err) => {
    if (err) {
      console.error('❌ Error de conexión: ', err);
      return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
  });
//crea el servidor de la api
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
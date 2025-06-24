// Importa los módulos necesarios para crear el servidor y conectar a la base de datos
const express = require('express'); // Framework para crear el servidor web
const mysql = require('mysql2'); // Cliente para conectarse a MySQL
const bodyParser = require('body-parser'); // Middleware para parsear el cuerpo de las peticiones
const cors = require('cors'); // Middleware para permitir peticiones de otros orígenes
const helmet = require('helmet'); // Middleware para mejorar la seguridad HTTP

const app = express(); // Inicializa la aplicación Express
const port = 3001; // Puerto donde correrá el servidor

// Middleware globales para seguridad y manejo de datos
app.use(cors()); // Permite solicitudes desde otros dominios
app.use(bodyParser.json()); // Permite recibir datos en formato JSON
app.use(bodyParser.urlencoded({ extended: true })); // Permite recibir datos de formularios
app.use(helmet.contentSecurityPolicy({ // Configura políticas de seguridad para los recursos
  directives:
   { defaultSrc: ["'self'"],
     styleSrc: ["'self'", "https://www.gstatic.com"],
     scriptSrc: ["'self'", "https://translate.googleapis.com", "https://www.gstatic.com"],
     imgSrc: ["'self'", "data:", "https://www.gstatic.com"],
     fontSrc: ["'self'", "https://fonts.gstatic.com"],
     connectSrc: ["'self'"],
     frameSrc: ["'self'", "https://translate.google.com"] }
}));
app.use(express.json());

// Configuración de la conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1026299643Julio', // ¡No guardar contraseñas en texto plano en producción!
    database: 'granitos_arenas_decorativas',
    port: 3306
  });

// Ruta para registrar usuarios en la base de datos
app.post('/api/registro', (req, res) => {
  const { nombre, correo, contrasena, terminos_aceptados } = req.body;
  if (!terminos_aceptados) return res.status(400).json({ message: 'Debe aceptar los términos' });

  // Inserta el nuevo usuario en la tabla 'usuarios'
  connection.query(
    'INSERT INTO usuarios SET ?',
    { nombre, correo, contrasena, terminos_aceptados },
    (error, results) => {
      if (error) {
        console.error('Error al registrar usuario:', error);
        // Manejo específico para correo duplicado
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Este correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.' });
        }
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

  // Busca el usuario en la base de datos con el correo y contraseña proporcionados
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

// Ruta para comprar un producto
app.post('/api/comprar', (req, res) => {
  const { producto_id, cantidad, cliente_nombre, cliente_email } = req.body; 
  if (!producto_id || !cantidad || !cliente_nombre || !cliente_email) {
    return res.status(400).json({ message: 'Faltan datos para la compra' });
  }
  // Inserta la compra en la tabla 'compras'
  connection.query(
    'INSERT INTO comprar (producto_id, cantidad, cliente_nombre, cliente_email) VALUES (?, ?, ?, ?)',
    [producto_id, cantidad, cliente_nombre, cliente_email],
    (error, results) => {
      if (error) {
        console.error('Error al registrar compra:', error);
        return res.status(500).json({ message: 'Error al procesar la compra.' });
      }
      // Aquí podrías generar una factura PDF y devolver su URL
      res.status(201).json({ message: 'Compra realizada exitosamente.', factura_pdf_url: null });
    }
  );
}
);

// Ruta para comprar una piedra (descontar stock y guardar detalles en compras y detalle_compra)
app.post('/api/comprar-piedra', (req, res) => {
   // Aquí va la lógica para registrar la compra de una piedra
  res.json({ success: true, message: 'Compra registrada correctamente.' });
  const { id, cantidad, cliente, pago, fecha } = req.body;
  if (!id || !cantidad) return res.status(400).json({ success: false, message: 'Faltan datos' });

  connection.query('SELECT cantidad, valor FROM piedras WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: 'Piedra no encontrada' });
    if (results[0].cantidad < cantidad) return res.status(400).json({ success: false, message: 'Stock insuficiente' });
    const valor_unitario = results[0].valor;
    // Descontar stock
    connection.query('UPDATE piedras SET cantidad = cantidad - ? WHERE id = ?', [cantidad, id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Error al actualizar stock' });
      // Guardar en tabla compras
      connection.query(
        'INSERT INTO compras (cliente_nombre, cliente_email, cliente_direccion, pago, fecha) VALUES (?, ?, ?, ?, ?)',
        [cliente?.nombre || '', cliente?.email || '', cliente?.direccion || '', pago || '', fecha || ''],
        (err3, resultCompra) => {
          if (err3) return res.status(500).json({ success: false, message: 'Error al registrar la compra' });
          const compraId = resultCompra.insertId;
          // Guardar detalle de la compra
          connection.query(
            'INSERT INTO detalle_compras (compra_id, piedra_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
            [compraId, id, cantidad, valor_unitario],
            (err4) => {
              if (err4) return res.status(500).json({ success: false, message: 'Error al registrar el detalle de compra' });
              res.status(200).json({ success: true, message: 'Compra realizada y registrada' });
            }
          );
        }
      );
    });
  });
});

// Ruta para comprar una arena (descontar stock y guardar detalles en compras y detalle_compras)
app.post('/api/comprar-arena', (req, res) => {
  const { id, cantidad, cliente, pago, fecha } = req.body;
  if (!id || !cantidad) return res.status(400).json({ success: false, message: 'Faltan datos' });

  connection.query('SELECT cantidad, valor FROM arenas WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: 'Arena no encontrada' });
    if (results[0].cantidad < cantidad) return res.status(400).json({ success: false, message: 'Stock insuficiente' });
    const valor_unitario = results[0].valor;
    // Descontar stock
    connection.query('UPDATE arenas SET cantidad = cantidad - ? WHERE id = ?', [cantidad, id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Error al actualizar stock' });
      // Guardar en tabla compras
      connection.query(
        'INSERT INTO compras (cliente_nombre, cliente_email, cliente_direccion, pago, fecha) VALUES (?, ?, ?, ?, ?)',
        [cliente?.nombre || '', cliente?.email || '', cliente?.direccion || '', pago || '', fecha || ''],
        (err3, resultCompra) => {
          if (err3) return res.status(500).json({ success: false, message: 'Error al registrar la compra' });
          const compraId = resultCompra.insertId;
          // Guardar detalle de la compra
          connection.query(
            'INSERT INTO detalle_compras (compra_id, arena_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
            [compraId, id, cantidad, valor_unitario],
            (err4) => {
              if (err4) return res.status(500).json({ success: false, message: 'Error al registrar el detalle de compra' });
              res.status(200).json({ success: true, message: 'Compra realizada y registrada' });
            }
          );
        }
      );
    });
  });
});

// Ruta para comprar varios productos del carrito
app.post('/api/comprar', (req, res) => {
   // Aquí va la lógica para registrar la compra de una piedra
  res.json({ success: true, message: 'Compra registrada correctamente.' });
  const { productos, cliente, pago, fecha } = req.body;
  if (!Array.isArray(productos) || productos.length === 0 || !cliente || !pago || !fecha) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }
  // Verificar stock de todos los productos
  const ids = productos.map(p => p.id);
  connection.query('SELECT id, cantidad, valor FROM piedras WHERE id IN (?)', [ids], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al verificar stock.' });
    for (let p of productos) {
      const piedra = results.find(r => r.id == p.id);
      if (!piedra) return res.status(404).json({ success: false, message: `Piedra ID ${p.id} no encontrada` });
      if (piedra.cantidad < p.cantidad) return res.status(400).json({ success: false, message: `Stock insuficiente para ${piedra.id}` });
    }
    // Descontar stock
    let updates = productos.map(p => new Promise((resolve, reject) => {
      connection.query('UPDATE piedras SET cantidad = cantidad - ? WHERE id = ?', [p.cantidad, p.id], (e) => e ? reject(e) : resolve());
    }));
    Promise.all(updates).then(() => {
      // Guardar en tabla compras
      connection.query(
        'INSERT INTO compras (cliente_nombre, cliente_email, cliente_direccion, pago, fecha) VALUES (?, ?, ?, ?, ?)',
        [cliente.nombre, cliente.email, cliente.direccion, pago, fecha],
        (err2, resultCompra) => {
          if (err2) return res.status(500).json({ success: false, message: 'Error al registrar la compra.' });
          const compraId = resultCompra.insertId;
          // Guardar detalles de la compra
          const detalles = productos.map(p => [compraId, p.id, p.cantidad, Number(results.find(r => r.id == p.id).valor)]);
          connection.query(
            'INSERT INTO detalle_compras (compra_id, piedra_id, cantidad, precio_unitario) VALUES ?',
            [detalles],
            (err3) => {
              if (err3) return res.status(500).json({ success: false, message: 'Error al registrar los detalles de la compra.' });
              res.status(200).json({ success: true, message: 'Compra registrada correctamente.' });
            }
          );
        }
      );
    }).catch(() => {
      res.status(500).json({ success: false, message: 'Error al actualizar stock.' });
    });
  });
});

// Ruta para obtener todas las piedras con su valor
app.get('/api/piedras', (req, res) => {
  connection.query('SELECT id, nombre_piedra, valor, imagen, cantidad FROM piedras', (error, results) => {
    if (error) {
      console.error('Error al obtener piedras:', error);
      return res.status(500).json({ message: 'Error al obtener las piedras.' });
    }
    res.status(200).json(results);
  });
});

// Ruta para traer todos los productos de piedras, arenas y terrarios
app.get('/api/todos-productos', (req, res) => {
  const queries = [
    `SELECT id, nombre AS nombre, valor, imagen_url, descripcion, 'piedra' AS tipo FROM piedras`,
    `SELECT id, nombre AS nombre, valor, imagen_url, descripcion, 'arena' AS tipo FROM arenas`,
    `SELECT id, nombre AS nombre, valor, imagen_url, descripcion, 'terrario' AS tipo FROM terrarios`
  ];
  const sql = queries.join(' UNION ALL ');
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener todos los productos:', err);
      return res.status(500).json({ message: 'Error al obtener los productos.' });
    }
    res.status(200).json(results);
  });
});

// Conecta a la base de datos y muestra mensaje en consola
connection.connect((err) => {
    if (err) {
      console.error('❌ Error de conexión: ', err);
      return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
});
// Inicia el servidor de la API y lo deja escuchando en el puerto definido
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
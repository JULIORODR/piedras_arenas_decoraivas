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

// Ruta para obtener todos los productos
app.post('/api/productos', (req, res) => {
  // Consulta para obtener todos los productos de la base de datos
  connection.query('SELECT * FROM productos', (error, results) => {
    if (error) {
      console.error('Error al obtener productos:', error);
      return res.status(500).json({ message: 'Error al obtener los productos.' });
    }
    res.status(200).json(results); // Devuelve los productos encontrados
  });
});

// Utilidad para formatear fecha a 'YYYY-MM-DD HH:mm:ss'
function toMySQLDatetime(date) {
  let d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  return d.getFullYear() + '-' +
    pad(d.getMonth() + 1) + '-' +
    pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' +
    pad(d.getMinutes()) + ':' +
    pad(d.getSeconds());
}

// Ruta para comprar una piedra (detalles)
app.post('/api/comprar-piedra', (req, res) => {
  const { id, cantidad, cliente, pago } = req.body;
  // Forzar método de pago a "efectivo" (ignora lo que venga del frontend)
  const metodoPago = "efectivo";
  const fechaMySQL = toMySQLDatetime();
  if (
    !id ||
    !cantidad ||
    !cliente ||
    typeof cliente.nombre !== 'string' ||
    typeof cliente.email !== 'string' ||
    typeof cliente.direccion !== 'string' ||
    !String(cliente.nombre).trim() ||
    !String(cliente.email).trim() ||
    !String(cliente.direccion).trim()
  ) {
    return res.status(400).json({ success: false, message: 'Faltan datos obligatorios para la compra.' });
  }

  connection.query('SELECT cantidad, valor FROM piedras WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al consultar piedra:', err);
      return res.status(500).json({ success: false, message: 'Error al consultar piedra.' });
    }
    if (results.length === 0) {
      console.error('Piedra no encontrada');
      return res.status(404).json({ success: false, message: 'Piedra no encontrada' });
    }
    if (results[0].cantidad < cantidad) {
      console.error('Stock insuficiente');
      return res.status(400).json({ success: false, message: 'Stock insuficiente' });
    }
    const valor_unitario = Number(results[0].valor);
    if (isNaN(valor_unitario)) {
      console.error('El valor de la piedra no es un número válido');
      return res.status(500).json({ success: false, message: 'El valor de la piedra no es válido.' });
    }
    // Descontar stock
    connection.query('UPDATE piedras SET cantidad = cantidad - ? WHERE id = ?', [cantidad, id], (err2) => {
      if (err2) {
        console.error('Error al actualizar stock:', err2);
        return res.status(500).json({ success: false, message: 'Error al actualizar stock' });
      }
      // Guardar en tabla compras
      connection.query(
        'INSERT INTO compras (cliente_nombre, cliente_email, cliente_direccion, pago, fecha) VALUES (?, ?, ?, ?, ?)',
        [cliente.nombre.trim(), cliente.email.trim(), cliente.direccion.trim(), metodoPago, fechaMySQL],
        (err3, resultCompra) => {
          if (err3) {
            console.error('Error al registrar la compra:', err3);
            return res.status(500).json({ success: false, message: 'Error al registrar la compra' });
          }
          const compraId = resultCompra.insertId;
          // Guardar detalle de la compra
          connection.query(
            'INSERT INTO detalle_compras (compra_id, piedra_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
            [compraId, id, cantidad, valor_unitario],
            (err4) => {
              if (err4) {
                console.error('Error al registrar el detalle de compra:', err4);
                return res.status(500).json({ success: false, message: 'Error al registrar el detalle de compra' });
              }
              res.status(200).json({ success: true, message: 'Compra realizada y registrada' });
            }
          );
        }
      );
    });
  });
});

// Ruta para comprar varios productos del carrito (única y correcta)
app.post('/api/comprar', (req, res) => {
  const { productos, cliente, pago } = req.body;
  // Forzar método de pago a "efectivo" (ignora lo que venga del frontend)
  const metodoPago = "efectivo";
  const fechaMySQL = toMySQLDatetime();
  if (!Array.isArray(productos) || productos.length === 0 || !cliente) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }
  // Verificar stock de todos los productos
  const ids = productos.map(p => p.id);
  connection.query('SELECT id, cantidad, valor FROM piedras WHERE id IN (?)', [ids], (err, results) => {
    if (err) {
      console.error('Error al verificar stock:', err);
      return res.status(500).json({ success: false, message: 'Error al verificar stock.' });
    }
    for (let p of productos) {
      const piedra = results.find(r => r.id == p.id);
      if (!piedra) {
        console.error(`Piedra ID ${p.id} no encontrada`);
        return res.status(404).json({ success: false, message: `Piedra ID ${p.id} no encontrada` });
      }
      if (piedra.cantidad < p.cantidad) {
        console.error(`Stock insuficiente para ${piedra.id}`);
        return res.status(400).json({ success: false, message: `Stock insuficiente para ${piedra.id}` });
      }
    }
    // Descontar stock
    let updates = productos.map(p => new Promise((resolve, reject) => {
      connection.query('UPDATE piedras SET cantidad = cantidad - ? WHERE id = ?', [p.cantidad, p.id], (e) => e ? reject(e) : resolve());
    }));
    Promise.all(updates).then(() => {
      connection.query(
        'INSERT INTO compras (cliente_nombre, cliente_email, cliente_direccion, pago, fecha) VALUES (?, ?, ?, ?, ?)',
        [cliente.nombre, cliente.email, cliente.direccion, metodoPago, fechaMySQL],
        (err2, resultCompra) => {
          if (err2) {
            console.error('Error al registrar la compra:', err2);
            return res.status(500).json({ success: false, message: 'Error al registrar la compra.' });
          }
          const compraId = resultCompra.insertId;
          // Guardar detalles de la compra
          const detalles = productos.map(p => {
            const piedra = results.find(r => r.id == p.id);
            if (!piedra) {
              console.error(`No se encontró piedra con id ${p.id} para detalle_compras`);
              return [compraId, p.id, p.cantidad, 0];
            }
            return [compraId, p.id, p.cantidad, Number(piedra.valor)];
          });
          connection.query(
            'INSERT INTO detalle_compras (compra_id, piedra_id, cantidad, precio_unitario) VALUES ?',
            [detalles],
            (err3) => {
              if (err3) {
                console.error('Error al registrar los detalles de la compra:', err3);
                return res.status(500).json({ success: false, message: 'Error al registrar los detalles de la compra.' });
              }
              res.status(200).json({ success: true, message: 'Compra registrada correctamente.' });
            }
          );
        }
      );
    }).catch((errUpdate) => {
      console.error('Error al actualizar stock:', errUpdate);
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
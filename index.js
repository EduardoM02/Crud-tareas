const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();

// Configuración del servidor
app.use(express.static('crud'));
app.use(bodyParser.json());
app.use(session({
    secret: 'tu_clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 1 día
    }
}));

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud_tareas'
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
    console.log('Conexión a la base de datos establecida');
});

// Ruta para obtener una tarea por su ID
app.get('/api/tareas/:id', (req, res) => {
    const tareaId = req.params.id;

    // Verificar si el usuario está autorizado
    if (!req.session.usuarioId) {
        return res.redirect('/inicio.html'); // Redirige al archivo estático
    }

    const query = 'SELECT * FROM tareas WHERE id = ? AND usuario_id = ?';
    db.query(query, [tareaId, req.session.usuarioId], (err, result) => {
        if (err) {
            console.error('Error al obtener la tarea:', err);
            return res.status(500).json({ message: 'Error al obtener la tarea' });
        }

        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: 'Tarea no encontrada' });
        }
    });
});

// Ruta para obtener todas las tareas
app.get('/api/tareas', (req, res) => {
    if (!req.session.usuarioId) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    const query = 'SELECT * FROM tareas WHERE usuario_id = ?';
    db.query(query, [req.session.usuarioId], (err, results) => {
        if (err) {
            console.error('Error al obtener tareas:', err);
            return res.status(500).json({ message: 'Error al obtener tareas' });
        }
        res.json(results);
    });
});

// Ruta para agregar una tarea
app.post('/api/tareas', (req, res) => {
    if (!req.session.usuarioId) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    const { titulo, descripcion, fechaLimite, estado } = req.body;
    if (!titulo || !descripcion || !fechaLimite || !estado) {
        return res.status(400).json({ message: 'Faltan datos para agregar la tarea' });
    }

    if (!['pendiente', 'completada'].includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido' });
    }

    const query = 'INSERT INTO tareas (titulo, descripcion, fecha_limite, estado, usuario_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [titulo, descripcion, fechaLimite, estado, req.session.usuarioId], (err, result) => {
        if (err) {
            console.error('Error al agregar tarea:', err);
            return res.status(500).json({ message: 'Error al agregar tarea' });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// Ruta para actualizar tareas
app.post('/api/actualizar-tarea', (req, res) => {
    if (!req.session.usuarioId) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    const { id, titulo, descripcion, fecha_limite, estado } = req.body;

    if (!id || !titulo || !descripcion || !fecha_limite || !estado) {
        return res.status(400).json({ message: 'Faltan datos para actualizar la tarea' });
    }

    if (!['pendiente', 'completada'].includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido' });
    }

    const query = `
        UPDATE tareas
        SET titulo = ?, descripcion = ?, fecha_limite = ?, estado = ?
        WHERE id = ? AND usuario_id = ?
    `;
    db.query(query, [titulo, descripcion, fecha_limite, estado, id, req.session.usuarioId], (err, result) => {
        if (err) {
            console.error('Error al actualizar tarea:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada o no autorizada' });
        }

        res.json({ success: true });
    });
});

// Ruta para eliminar una tarea
app.delete('/api/tareas/:id', (req, res) => {
    const tareaId = req.params.id;

    if (!req.session.usuarioId) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    const query = 'DELETE FROM tareas WHERE id = ? AND usuario_id = ?';
    db.query(query, [tareaId, req.session.usuarioId], (err, result) => {
        if (err) {
            console.error('Error al eliminar la tarea:', err);
            return res.status(500).json({ message: 'Error al eliminar la tarea' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }

        res.json({ success: true });
    });
});

// Ruta para verificar sesión
app.get('/api/verificar-sesion', (req, res) => {
    if (req.session && req.session.usuarioId) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
    const { nombreUsuario, contrasena } = req.body;

    const query = 'SELECT id FROM usuarios WHERE nombre_usuario = ? AND contrasena = ?';
    db.query(query, [nombreUsuario, contrasena], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        if (results.length > 0) {
            req.session.usuarioId = results[0].id;
            res.json({ success: true });
        } else {
            res.status(401).json({ message: 'Usuario y/o contraseña incorrectos.' });
        }
    });
});

// Ruta para cerrar sesión
app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.json({ success: true });
    });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

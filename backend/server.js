import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import db from './database.js';
import { checkBannedIP, trackLoginAttempt, logLoginAttempt, getClientIP } from './middleware/security.js';
import { authenticateToken, generateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (Unraid reverse proxy için)
app.set('trust proxy', 1);

// Güvenlik middleware'leri
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Frontend ile uyumluluk için
}));

// CORS - Sadece belirli origin'lere izin ver
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://tech.barisbd.tr',
  process.env.FRONTEND_URL || 'http://localhost:8080'
];

app.use(cors({
  origin: (origin, callback) => {
    // Origin yoksa (örn. Postman) veya allowedOrigins'te varsa izin ver
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS izni yok'));
    }
  },
  credentials: true
}));

// Rate limiting - Genel
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(express.json());

// Upload klasörlerini oluştur
const uploadsDir = join(__dirname, 'uploads');
const documentsDir = join(uploadsDir, 'documents');
const photosDir = join(uploadsDir, 'photos');

[uploadsDir, documentsDir, photosDir].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// Static dosyalar için
app.use('/uploads', express.static(uploadsDir));

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = req.path.includes('documents') ? documentsDir : photosDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Varsayılan şifre oluştur (ilk çalıştırmada)
const initPassword = async () => {
  const existing = db.prepare('SELECT * FROM auth WHERE id = 1').get();
  if (!existing) {
    const defaultPassword = '632536'; // Varsayılan şifre
    const hash = await bcrypt.hash(defaultPassword, 10);
    db.prepare('INSERT INTO auth (id, password_hash) VALUES (1, ?)').run(hash);
    console.log('✓ Varsayılan şifre oluşturuldu');
  }
};

initPassword();

// ================== AUTH ==================
app.post('/api/auth/login', checkBannedIP, trackLoginAttempt, async (req, res) => {
  try {
    const { password } = req.body;
    const clientIP = req.clientIP || getClientIP(req);
    const auth = db.prepare('SELECT password_hash FROM auth WHERE id = 1').get();
    
    if (!auth) {
      return res.status(500).json({ error: 'Sistem hatası' });
    }

    const valid = await bcrypt.compare(password, auth.password_hash);
    if (valid) {
      logLoginAttempt(clientIP, true);
      // JWT token oluştur
      const token = generateToken({ id: 1, authenticated: true });
      res.json({ success: true, token });
    } else {
      logLoginAttempt(clientIP, false);
      res.status(401).json({ error: 'Yanlış şifre' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Giriş hatası' });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Şifre en az 4 karakter olmalıdır' });
    }
    
    const auth = db.prepare('SELECT password_hash FROM auth WHERE id = 1').get();
    
    const valid = await bcrypt.compare(oldPassword, auth.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Eski şifre yanlış' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE auth SET password_hash = ? WHERE id = 1').run(newHash);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Şifre değiştirme hatası' });
  }
});

// ================== SETTINGS ==================
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings || { site_title: 'Tech Support', max_login_attempts: 3, ban_duration_hours: 24 });
  } catch (error) {
    res.status(500).json({ error: 'Ayarlar yüklenemedi' });
  }
});

app.put('/api/settings', authenticateToken, (req, res) => {
  try {
    const { site_title, max_login_attempts, ban_duration_hours } = req.body;
    
    db.prepare('UPDATE settings SET site_title = ?, max_login_attempts = ?, ban_duration_hours = ? WHERE id = 1')
      .run(site_title, max_login_attempts, ban_duration_hours);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ayarlar güncellenemedi' });
  }
});

// ================== BANNED IPS ==================
app.get('/api/banned-ips', authenticateToken, (req, res) => {
  try {
    const bannedIPs = db.prepare('SELECT * FROM banned_ips ORDER BY banned_at DESC').all();
    res.json(bannedIPs);
  } catch (error) {
    res.status(500).json({ error: 'Banlı IP listesi alınamadı' });
  }
});

app.post('/api/banned-ips', authenticateToken, (req, res) => {
  try {
    const { ip_address, ban_reason, permanent } = req.body;
    
    if (!ip_address) {
      return res.status(400).json({ error: 'IP adresi gerekli' });
    }
    
    const banned_until = permanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const result = db.prepare('INSERT INTO banned_ips (ip_address, ban_reason, banned_until) VALUES (?, ?, ?)')
      .run(ip_address, ban_reason || 'Manuel ban', banned_until);
    
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Bu IP zaten banlı' });
    } else {
      res.status(500).json({ error: 'IP banlanamadı' });
    }
  }
});

app.delete('/api/banned-ips/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM banned_ips WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'IP banı kaldırılamadı' });
  }
});

// ================== LOGIN ATTEMPTS ==================
app.get('/api/login-attempts', authenticateToken, (req, res) => {
  try {
    const attempts = db.prepare('SELECT * FROM login_attempts ORDER BY attempt_time DESC LIMIT 100').all();
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Giriş denemeleri alınamadı' });
  }
});

// ================== NOT KATEGORİLERİ ==================
app.get('/api/note-categories', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM note_categories ORDER BY created_at DESC').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/note-categories', authenticateToken, (req, res) => {
  try {
    const { name, color } = req.body;
    const result = db.prepare('INSERT INTO note_categories (name, color) VALUES (?, ?)').run(name, color || '#3B82F6');
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/note-categories/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM note_categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== NOTLAR ==================
app.get('/api/notes', authenticateToken, (req, res) => {
  try {
    const notes = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', authenticateToken, (req, res) => {
  try {
    const { title, content, category_id } = req.body;
    const result = db.prepare('INSERT INTO notes (title, content, category_id) VALUES (?, ?, ?)').run(title, content, category_id || null);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, category_id } = req.body;
    db.prepare('UPDATE notes SET title = ?, content = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(title, content, category_id || null, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== TODO KATEGORİLERİ ==================
app.get('/api/todo-categories', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM todo_categories ORDER BY created_at DESC').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todo-categories', authenticateToken, (req, res) => {
  try {
    const { name, color } = req.body;
    const result = db.prepare('INSERT INTO todo_categories (name, color) VALUES (?, ?)').run(name, color || '#3B82F6');
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todo-categories/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM todo_categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== TODO LİSTESİ ==================
app.get('/api/todos', authenticateToken, (req, res) => {
  try {
    const { category_id } = req.query;
    let todos;
    
    if (category_id) {
      todos = db.prepare('SELECT * FROM todos WHERE category_id = ? ORDER BY created_at DESC').all(category_id);
    } else {
      todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
    }
    
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', authenticateToken, (req, res) => {
  try {
    const { task, category_id } = req.body;
    const result = db.prepare('INSERT INTO todos (task, category_id) VALUES (?, ?)').run(task, category_id || null);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    const { completed } = req.body;
    db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(completed, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== DÖKÜMANLAR ==================
app.get('/api/documents', authenticateToken, (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const result = db.prepare(
      'INSERT INTO documents (filename, original_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)'
    ).run(file.filename, file.originalname, `/uploads/documents/${file.filename}`, file.mimetype, file.size);
    
    res.json({ id: result.lastInsertRowid, file_path: `/uploads/documents/${file.filename}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/documents/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FOTOĞRAF KATEGORİLERİ ==================
app.get('/api/photo-categories', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM photo_categories ORDER BY created_at DESC').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/photo-categories', authenticateToken, (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const result = db.prepare('INSERT INTO photo_categories (name, parent_id) VALUES (?, ?)').run(name, parent_id || null);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/photo-categories/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM photo_categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FOTOĞRAFLAR ==================
app.get('/api/photos', authenticateToken, (req, res) => {
  try {
    const { category_id } = req.query;
    let photos;
    
    if (category_id) {
      photos = db.prepare('SELECT * FROM photos WHERE category_id = ? ORDER BY created_at DESC').all(category_id);
    } else {
      photos = db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all();
    }
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/photos/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const { category_id, description } = req.body;
    
    const result = db.prepare(
      'INSERT INTO photos (filename, original_name, file_path, category_id, description, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(file.filename, file.originalname, `/uploads/photos/${file.filename}`, category_id || null, description || null, file.mimetype, file.size);
    
    res.json({ id: result.lastInsertRowid, file_path: `/uploads/photos/${file.filename}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/photos/:id', authenticateToken, (req, res) => {
  try {
    const { description } = req.body;
    db.prepare('UPDATE photos SET description = ? WHERE id = ?').run(description, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/photos/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== MAKİNA REHBERİ ==================
app.get('/api/machine-guide', authenticateToken, (req, res) => {
  try {
    const guides = db.prepare('SELECT * FROM machine_guide ORDER BY updated_at DESC').all();
    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/machine-guide', authenticateToken, (req, res) => {
  try {
    const { title, problem, solution } = req.body;
    const result = db.prepare('INSERT INTO machine_guide (title, problem, solution) VALUES (?, ?, ?)').run(title, problem, solution);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/machine-guide/:id', authenticateToken, (req, res) => {
  try {
    const { title, problem, solution } = req.body;
    db.prepare('UPDATE machine_guide SET title = ?, problem = ?, solution = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(title, problem, solution, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/machine-guide/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM machine_guide WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server çalışıyor: http://localhost:${PORT}`);
});

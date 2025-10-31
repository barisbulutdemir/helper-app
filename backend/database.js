import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data.db');

// Eğer veritabanı dosyası yoksa oluştur
if (!existsSync(dbPath)) {
  writeFileSync(dbPath, '');
}

const db = new Database(dbPath);

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS note_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES note_categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS todo_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES todo_categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photo_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES photo_categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    category_id INTEGER,
    description TEXT,
    file_type TEXT,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES photo_categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS machine_guide (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS machine_guide_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS machine_guide_tag_relations (
    guide_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (guide_id, tag_id),
    FOREIGN KEY (guide_id) REFERENCES machine_guide(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES machine_guide_tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    success INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS banned_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL UNIQUE,
    ban_reason TEXT,
    banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    banned_until DATETIME
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_title TEXT DEFAULT 'Tech Support',
    max_login_attempts INTEGER DEFAULT 3,
    ban_duration_hours INTEGER DEFAULT 24
  );
`);

// Mevcut tablolara color sütunu ekle (migration)
const addColorColumn = () => {
  try {
    // note_categories tablosunu kontrol et
    const noteColumns = db.prepare("PRAGMA table_info(note_categories)").all();
    const noteHasColor = noteColumns.some(col => col.name === 'color');
    
    if (!noteHasColor) {
      db.prepare('ALTER TABLE note_categories ADD COLUMN color TEXT DEFAULT "#3B82F6"').run();
      console.log('✓ note_categories tablosuna color sütunu eklendi');
      
      // Mevcut kategorilere farklı renkler ata
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
      const categories = db.prepare('SELECT id FROM note_categories').all();
      const updateStmt = db.prepare('UPDATE note_categories SET color = ? WHERE id = ?');
      categories.forEach((cat, index) => {
        updateStmt.run(colors[index % colors.length], cat.id);
      });
    }
    
    // todo_categories tablosunu kontrol et
    const todoColumns = db.prepare("PRAGMA table_info(todo_categories)").all();
    const todoHasColor = todoColumns.some(col => col.name === 'color');
    
    if (!todoHasColor) {
      db.prepare('ALTER TABLE todo_categories ADD COLUMN color TEXT DEFAULT "#3B82F6"').run();
      console.log('✓ todo_categories tablosuna color sütunu eklendi');
      
      // Mevcut kategorilere farklı renkler ata
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
      const categories = db.prepare('SELECT id FROM todo_categories').all();
      const updateStmt = db.prepare('UPDATE todo_categories SET color = ? WHERE id = ?');
      categories.forEach((cat, index) => {
        updateStmt.run(colors[index % colors.length], cat.id);
      });
    }
  } catch (error) {
    // Hata genellikle duplicate column olacak, sessizce atla
    if (!error.message.includes('duplicate column')) {
      console.error('Migration hatası:', error.message);
    }
  }
};

addColorColumn();

// Settings tablosunu başlat
const initSettings = () => {
  const existing = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!existing) {
    db.prepare('INSERT INTO settings (id, site_title, max_login_attempts, ban_duration_hours) VALUES (1, ?, ?, ?)').run('Tech Support', 3, 24);
    console.log('✓ Ayarlar başlatıldı');
  }
};

initSettings();

export default db;

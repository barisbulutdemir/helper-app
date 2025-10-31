import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data.db');
const db = new Database(dbPath);

// Renk paletleri
const colors = [
  '#3B82F6', // Mavi
  '#10B981', // Yeşil
  '#F59E0B', // Turuncu
  '#EF4444', // Kırmızı
  '#8B5CF6', // Mor
  '#EC4899', // Pembe
  '#14B8A6', // Teal
  '#F97316', // Koyu Turuncu
];

try {
  // note_categories tablosunu kontrol et
  const noteTableInfo = db.prepare("PRAGMA table_info(note_categories)").all();
  const noteHasColor = noteTableInfo.some(col => col.name === 'color');

  if (!noteHasColor) {
    console.log('note_categories tablosuna color sütunu ekleniyor...');
    db.prepare('ALTER TABLE note_categories ADD COLUMN color TEXT DEFAULT "#3B82F6"').run();
  }

  // Mevcut kategorilere renk ata
  const noteCategories = db.prepare('SELECT id FROM note_categories WHERE color IS NULL OR color = ""').all();
  if (noteCategories.length > 0) {
    console.log(`${noteCategories.length} not kategorisine renk atanıyor...`);
    const updateStmt = db.prepare('UPDATE note_categories SET color = ? WHERE id = ?');
    noteCategories.forEach((cat, index) => {
      const color = colors[index % colors.length];
      updateStmt.run(color, cat.id);
      console.log(`  Kategori ${cat.id}: ${color}`);
    });
  }

  // todo_categories tablosunu kontrol et
  const todoTableInfo = db.prepare("PRAGMA table_info(todo_categories)").all();
  const todoHasColor = todoTableInfo.some(col => col.name === 'color');

  if (!todoHasColor) {
    console.log('todo_categories tablosuna color sütunu ekleniyor...');
    db.prepare('ALTER TABLE todo_categories ADD COLUMN color TEXT DEFAULT "#3B82F6"').run();
  }

  // Mevcut kategorilere renk ata
  const todoCategories = db.prepare('SELECT id FROM todo_categories WHERE color IS NULL OR color = ""').all();
  if (todoCategories.length > 0) {
    console.log(`${todoCategories.length} todo kategorisine renk atanıyor...`);
    const updateStmt = db.prepare('UPDATE todo_categories SET color = ? WHERE id = ?');
    todoCategories.forEach((cat, index) => {
      const color = colors[index % colors.length];
      updateStmt.run(color, cat.id);
      console.log(`  Kategori ${cat.id}: ${color}`);
    });
  }

  console.log('\n✅ Migration tamamlandı!');
  
  // Sonuçları göster
  console.log('\nNot Kategorileri:');
  console.log(db.prepare('SELECT * FROM note_categories').all());
  
  console.log('\nTodo Kategorileri:');
  console.log(db.prepare('SELECT * FROM todo_categories').all());

} catch (error) {
  console.error('Hata:', error.message);
} finally {
  db.close();
}

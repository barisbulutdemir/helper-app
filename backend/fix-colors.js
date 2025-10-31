import db from './database.js';

const colors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

try {
  console.log('Veritabanı güncelleniyor...\n');

  // note_categories için color sütunu ekle
  try {
    db.prepare('ALTER TABLE note_categories ADD COLUMN color TEXT DEFAULT "#3B82F6"').run();
    console.log('✓ note_categories tablosuna color sütunu eklendi');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('✓ note_categories tablosunda color sütunu zaten var');
    } else {
      throw e;
    }
  }

  // Mevcut kategorilere renk ata
  const noteCategories = db.prepare('SELECT id, name FROM note_categories').all();
  console.log(`\n${noteCategories.length} not kategorisi bulundu:`);
  
  const updateNote = db.prepare('UPDATE note_categories SET color = ? WHERE id = ?');
  noteCategories.forEach((cat, index) => {
    const color = colors[index % colors.length];
    updateNote.run(color, cat.id);
    console.log(`  ${cat.name} → ${color}`);
  });

  // todo_categories için color sütunu ekle
  try {
    db.prepare('ALTER TABLE todo_categories ADD COLUMN color TEXT DEFAULT "#3B82F6"').run();
    console.log('\n✓ todo_categories tablosuna color sütunu eklendi');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('\n✓ todo_categories tablosunda color sütunu zaten var');
    } else {
      throw e;
    }
  }

  // Mevcut todo kategorilerine renk ata
  const todoCategories = db.prepare('SELECT id, name FROM todo_categories').all();
  console.log(`\n${todoCategories.length} todo kategorisi bulundu:`);
  
  const updateTodo = db.prepare('UPDATE todo_categories SET color = ? WHERE id = ?');
  todoCategories.forEach((cat, index) => {
    const color = colors[index % colors.length];
    updateTodo.run(color, cat.id);
    console.log(`  ${cat.name} → ${color}`);
  });

  console.log('\n✅ Veritabanı başarıyla güncellendi!\n');

  // Kontrol et
  console.log('Güncel not kategorileri:');
  console.log(db.prepare('SELECT * FROM note_categories').all());

} catch (error) {
  console.error('❌ Hata:', error.message);
} finally {
  db.close();
}

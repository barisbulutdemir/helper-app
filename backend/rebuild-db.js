import { existsSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data.db');

// Yedek al
if (existsSync(dbPath)) {
  const backupPath = join(__dirname, `data.db.backup-${Date.now()}`);
  renameSync(dbPath, backupPath);
  console.log(`✓ Veritabanı yedeklendi: ${backupPath}`);
}

console.log('✓ Veritabanı silindi, yeniden oluşturulacak...');
console.log('✓ Şimdi server.js\'i başlatın, yeni veritabanı color sütunuyla oluşturulacak!');

# 🔧 Teknik Servis Yardımcı Uygulaması

Makina teknik servisi için özel geliştirilmiş, şifre korumalı web uygulaması.

## 📋 Özellikler

- ✅ **Şifre Korumalı Giriş** - Varsayılan şifre: `12345`
- 📝 **Notlar & İşler** - Önemli notlarınızı saklayın
- ✅ **Yapılacaklar Listesi** - Makinada yapılacak işleri takip edin
- 📄 **Döküman Yönetimi** - PDF ve diğer dosyaları yükleyin
- 📸 **Fotoğraf Galerisi** - Kategorilere göre proje fotoğraflarını organize edin
- 🔧 **Makina Arıza Rehberi** - Sorun-Çözüm tablosu oluşturun

## 🚀 Kurulum

### Gereksinimler
- Docker ve Docker Compose

### Unraid'de Kurulum

1. Proje klasörünü Unraid sunucunuza kopyalayın

2. Backend bağımlılıklarını yükleyin:
```bash
cd backend
npm install
cd ..
```

3. Frontend bağımlılıklarını yükleyin:
```bash
npm install
```

4. Docker Compose ile başlatın:
```bash
docker-compose up -d --build
```

5. Uygulamaya erişin:
- Frontend: `http://UNRAID-IP:8080`
- Backend API: `http://UNRAID-IP:3001`

### Yerel Geliştirme

#### Backend'i çalıştırma:
```bash
cd backend
npm install
npm start
```
Backend `http://localhost:3001` adresinde çalışacak.

#### Frontend'i çalıştırma:
```bash
npm install
npm run dev
```
Frontend `http://localhost:5173` adresinde çalışacak.

## 🔐 Şifre Değiştirme

Uygulamaya giriş yaptıktan sonra şifre değiştirmek için:

### Yöntem 1: API ile
```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "12345",
    "newPassword": "yeniSifreniz"
  }'
```

### Yöntem 2: Node.js ile
```bash
cd backend
node -e "
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const db = new Database('data.db');
const newPassword = 'yeniSifreniz';
bcrypt.hash(newPassword, 10).then(hash => {
  db.prepare('UPDATE auth SET password_hash = ? WHERE id = 1').run(hash);
  console.log('Şifre güncellendi!');
  db.close();
});
"
```

## 📁 Proje Yapısı

```
helper-app/
├── backend/               # Node.js Express backend
│   ├── server.js         # API server
│   ├── database.js       # SQLite veritabanı
│   ├── data.db           # SQLite dosyası (otomatik oluşur)
│   └── uploads/          # Yüklenen dosyalar
│       ├── documents/
│       └── photos/
├── src/                  # React frontend
│   ├── components/       # React bileşenleri
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── NotesSection.jsx
│   │   ├── TodoSection.jsx
│   │   ├── DocumentsSection.jsx
│   │   ├── PhotoGallery.jsx
│   │   └── MachineGuide.jsx
│   ├── App.jsx
│   └── main.jsx
├── docker-compose.yml    # Docker orchestration
├── Dockerfile            # Frontend Dockerfile
└── backend/Dockerfile    # Backend Dockerfile
```

## 🗄️ Veritabanı

SQLite veritabanı otomatik olarak oluşturulur ve şu tabloları içerir:
- `notes` - Notlar
- `todos` - Yapılacaklar
- `documents` - Dökümanlar
- `photo_categories` - Fotoğraf kategorileri
- `photos` - Fotoğraflar
- `machine_guide` - Makina rehberi
- `auth` - Şifre hash'i

## 🔧 Teknolojiler

**Frontend:**
- React 18
- Vite
- TailwindCSS

**Backend:**
- Node.js
- Express
- SQLite (better-sqlite3)
- Multer (dosya yükleme)
- bcrypt (şifre hash)

**Deploy:**
- Docker
- Nginx

## 📝 Kullanım İpuçları

### Fotoğraf Galerisi
- Kategoriler oluşturun (örn: "Kuveyt Projesi", "Makina", "Beton Santrali")
- Alt kategoriler ekleyebilirsiniz
- Her fotoğrafa açıklama ekleyin
- Video dosyaları da desteklenir

### Makina Rehberi
- Sorun başlığı ekleyin (örn: "TS-2 Hareket Etmiyor")
- Sorun detaylarını yazın
- Çözüm adımlarını listeleyin
- Arama özelliği ile hızlıca bulun

## 🛠️ Güncelleme

```bash
cd /mnt/user/appdata/helper-app
git pull
docker-compose down
docker-compose up -d --build
```

## 📱 Mobil Uyumlu

Uygulama responsive tasarıma sahiptir ve mobil cihazlardan da rahatça kullanılabilir.

## 🔒 Güvenlik Notları

- Varsayılan şifreyi mutlaka değiştirin
- Unraid firewall ayarlarını kontrol edin
- Yedekleme için `backend/data.db` ve `backend/uploads/` klasörünü yedekleyin

## 📞 Destek

Sorun yaşarsanız:
1. Docker loglarını kontrol edin: `docker-compose logs`
2. Backend loglara bakın: `docker logs helper-app-backend`
3. Frontend loglara bakın: `docker logs helper-app-frontend`

## 📄 Lisans

Bu proje kişisel kullanım için geliştirilmiştir.

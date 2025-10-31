# Unraid Sunucusuna Deployment

## 📋 Özellikler

### Güvenlik
- ✅ **Şifre Koruması**: Varsayılan şifre `632536` (ilk girişte değiştirin!)
- ✅ **IP Ban Sistemi**: 3 başarısız girişten sonra otomatik IP ban (24 saat)
- ✅ **Rate Limiting**: 15 dakikada maksimum 100 istek/IP
- ✅ **CORS Koruması**: Sadece belirlenen origin'lere izin
- ✅ **Helmet.js**: HTTP güvenlik başlıkları
- ✅ **Güvenli Şifreleme**: bcrypt ile hash'lenmiş şifreler

### Ayarlar Paneli
- 🔧 Site başlığını değiştirme
- 🔐 Şifre değiştirme
- 🚫 IP ban yönetimi (manuel/otomatik)
- ⚙️ Güvenlik ayarları (max deneme sayısı, ban süresi)

## 📦 Kurulum Adımları

### 1. Projeyi Unraid'e Kopyalama

```bash
# Windows'tan Unraid'e kopyalama
scp -r C:\Users\Baris\Desktop\helper-app root@[UNRAID-IP]:/mnt/user/appdata/helper-app
```

veya

```bash
# WinSCP, FileZilla gibi araçlarla manuel kopyalama
# Hedef: /mnt/user/appdata/helper-app
```

### 2. Unraid'e SSH Bağlantısı

```bash
ssh root@[UNRAID-IP]
```

### 3. Environment Variables Ayarlama

```bash
cd /mnt/user/appdata/helper-app

# Backend .env dosyası
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://[UNRAID-IP]:8080
EOF

# Frontend .env dosyası
cat > .env << 'EOF'
VITE_API_URL=http://[UNRAID-IP]:3001
EOF
```

**Not:** `[UNRAID-IP]` yerine Unraid sunucunuzun IP adresini yazın (örn: `192.168.1.100`)

### 4. Docker Compose ile Başlatma

```bash
cd /mnt/user/appdata/helper-app
docker-compose up -d
```

### 5. Container'ları Kontrol Etme

```bash
# Container durumunu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f

# Sadece backend logları
docker-compose logs -f backend

# Sadece frontend logları
docker-compose logs -f frontend
```

## 🌐 Erişim

- **Frontend**: `http://[UNRAID-IP]:8080`
- **Backend API**: `http://[UNRAID-IP]:3001`

## 🔐 İlk Giriş

1. Frontend URL'sine gidin: `http://[UNRAID-IP]:8080`
2. Varsayılan şifre ile giriş yapın: `632536`
3. **ÖNEMLİ:** Hemen Ayarlar sekmesine gidin ve şifrenizi değiştirin!

## ⚙️ Ayarlar

### Şifre Değiştirme
1. Ayarlar → Şifre Değiştir
2. Mevcut şifre: `632536`
3. Yeni şifrenizi girin

### Site Başlığı
1. Ayarlar → Genel Ayarlar
2. Site başlığını istediğiniz gibi değiştirin

### Güvenlik Ayarları
1. Ayarlar → Genel Ayarlar
2. **Maksimum Başarısız Giriş Denemesi**: Kaç denemeden sonra ban (varsayılan: 3)
3. **Ban Süresi**: Otomatik ban süresi saat cinsinden (varsayılan: 24)

### IP Ban Yönetimi
1. Ayarlar → Güvenlik
2. Manuel IP banlama
3. Banlı IP'leri görüntüleme ve ban kaldırma

## 🔄 Güncelleme

```bash
cd /mnt/user/appdata/helper-app

# Container'ları durdur
docker-compose down

# Yeni dosyaları kopyala (Windows'tan)
# scp -r C:\Users\Baris\Desktop\helper-app root@[UNRAID-IP]:/mnt/user/appdata/helper-app

# Yeniden başlat
docker-compose up -d --build
```

## 🛑 Durdurma ve Silme

```bash
# Durdur
docker-compose down

# Durdur ve volume'leri sil (veritabanını siler!)
docker-compose down -v

# Tamamen kaldır
cd /mnt/user/appdata
rm -rf helper-app
```

## 📊 Veritabanı

- **Tip**: SQLite
- **Konum**: `/mnt/user/appdata/helper-app/backend/data.db`
- **Yedekleme**: Bu dosyayı düzenli olarak yedekleyin!

```bash
# Veritabanı yedeği alma
cp /mnt/user/appdata/helper-app/backend/data.db \
   /mnt/user/backups/helper-app-$(date +%Y%m%d).db
```

## 🐛 Sorun Giderme

### Backend'e erişilemiyor
```bash
# Backend loglarını kontrol et
docker-compose logs backend

# Container çalışıyor mu?
docker ps | grep helper
```

### Frontend yüklenmiyor
```bash
# Frontend loglarını kontrol et
docker-compose logs frontend

# Nginx yapılandırmasını kontrol et
docker exec helper-app-frontend cat /etc/nginx/conf.d/default.conf
```

### CORS hatası
```bash
# Backend .env dosyasında FRONTEND_URL'yi kontrol et
cat backend/.env

# Doğru IP ve port olduğundan emin olun
```

### IP ban'dan çıkamama
```bash
# Veritabanına doğrudan erişim
docker exec helper-app-backend node -e "
const db = require('better-sqlite3')('/app/data.db');
db.prepare('DELETE FROM banned_ips WHERE ip_address = ?').run('[IP-ADRESI]');
console.log('Ban kaldırıldı');
"
```

## 🔒 Güvenlik Notları

1. **Şifreyi hemen değiştirin**: Varsayılan şifre herkese açık
2. **Reverse Proxy kullanın**: Nginx Proxy Manager veya Traefik önerilir
3. **SSL/HTTPS**: Let's Encrypt ile ücretsiz SSL sertifikası
4. **Firewall**: Sadece gerekli portları açın
5. **Yedekleme**: data.db dosyasını düzenli yedekleyin
6. **Güncellemeler**: Projeyi güncel tutun

## 📱 Mobil Erişim

Site mobil uyumludur. Tarayıcınızda "Ana Ekrana Ekle" özelliğini kullanabilirsiniz.

## 🆘 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker-compose logs`
2. Container'ların çalıştığından emin olun: `docker-compose ps`
3. Port çakışması olmadığını kontrol edin: `netstat -tulpn | grep -E '3001|8080'`

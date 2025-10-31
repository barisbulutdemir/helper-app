# 🔒 Güvenlik Özeti

## Uygulanan Güvenlik Önlemleri

### 1. Authentication & Authorization ✅

#### Şifre Güvenliği
- **bcrypt** ile hash'lenmiş şifreler (10 salt rounds)
- Varsayılan şifre: `632536` (değiştirilebilir)
- Minimum şifre uzunluğu: 4 karakter
- Şifre değiştirme özelliği

#### Session Yönetimi
- localStorage tabanlı basit session
- Logout özelliği
- Otomatik session kontrolü

### 2. Rate Limiting ✅

```javascript
- Genel: 100 istek / 15 dakika / IP
- Login endpoint'i için özel kısıtlama
```

### 3. IP Ban Sistemi ✅

#### Otomatik Ban
- 3 başarısız giriş denemesinden sonra otomatik ban
- Ban süresi: 24 saat (ayarlanabilir)
- 15 dakikalık zaman penceresi

#### Manuel Ban
- Admin panelinden manuel IP banlama
- Geçici veya kalıcı ban seçeneği
- Ban nedeni belirtme
- Banlı IP'leri görüntüleme ve yönetme

#### Ban Takibi
- Tüm login denemeleri veritabanında kaydedilir
- IP adresi, zaman damgası ve başarı durumu
- 30 günden eski kayıtlar otomatik temizlenir

### 4. CORS (Cross-Origin Resource Sharing) ✅

```javascript
// Sadece belirlenen origin'lere izin
allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.FRONTEND_URL
]
```

**Önemli:** Production'da FRONTEND_URL environment variable'ını ayarlayın!

### 5. HTTP Security Headers ✅

**Helmet.js** kullanımı:
- X-Powered-By header'ı gizlendi
- XSS Protection aktif
- Content Type Sniffing koruması
- Frameguard (Clickjacking koruması)

### 6. Input Validation ✅

- SQL Injection koruması: **Prepared Statements** (better-sqlite3)
- Dosya yükleme limiti: **50MB**
- Form validasyonları

### 7. File Upload Security 🟡

**Mevcut:**
- Dosya boyutu limiti: 50MB
- Dosya adı randomization
- Ayrı klasörlerde saklama (documents/photos)

**Eksikler:**
- ❌ Dosya tipi validasyonu yok
- ❌ Dosya içeriği kontrolü yok
- ⚠️ **Risk:** Kötü amaçlı dosya yüklenebilir

**Öneri:** Ek dosya tipi kontrolü ekleyin:

```javascript
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedDocTypes = ['application/pdf', 'application/msword', ...];

if (!allowedTypes.includes(file.mimetype)) {
  return res.status(400).json({ error: 'Geçersiz dosya tipi' });
}
```

### 8. Database Security ✅

- **SQLite** kullanımı (dosya tabanlı)
- Prepared statements ile SQL Injection koruması
- Şifreler bcrypt ile hash'lenmiş
- Foreign key constraints

### 9. Error Handling 🟡

**Mevcut:**
- Try-catch blokları
- Genel hata mesajları

**İyileştirme:**
- Detaylı hata logları sadece server-side
- Client'a minimal hata mesajları

### 10. Environment Variables ✅

```bash
# Backend
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://[UNRAID-IP]:8080

# Frontend
VITE_API_URL=http://[UNRAID-IP]:3001
```

## 🔴 Kritik Güvenlik Tavsiyeleri

### 1. İlk Kurulumda MUTLAKA Yapın

```bash
1. Varsayılan şifreyi değiştirin (632536)
2. Environment variables'ları ayarlayın
3. HTTPS/SSL kullanın (Reverse Proxy ile)
```

### 2. Production Ortamı için

#### A. Reverse Proxy Kullanın (ÖNEMLİ!)

**Nginx Proxy Manager veya Traefik:**
```nginx
# Nginx örnek
server {
    listen 443 ssl http2;
    server_name helper.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### B. SSL/HTTPS Kullanın

```bash
# Let's Encrypt ile ücretsiz SSL
# Certbot kullanımı veya Nginx Proxy Manager
```

#### C. Firewall Ayarları

```bash
# Sadece gerekli portları açın
# Eğer reverse proxy kullanıyorsanız:
- 443 (HTTPS) - Dış erişim
- 80 (HTTP) - Redirect için
- 8080, 3001 - Sadece localhost/internal
```

### 3. Düzenli Bakım

```bash
# Veritabanı yedeği (günlük)
0 2 * * * cp /mnt/user/appdata/helper-app/backend/data.db \
           /mnt/user/backups/helper-app-$(date +\%Y\%m\%d).db

# Eski login attempt kayıtlarını temizleme (otomatik)
# 30 gün öncesi otomatik temizlenir

# Banlı IP listesini düzenli kontrol edin
```

### 4. Monitoring

```bash
# Log dosyalarını izleyin
docker-compose logs -f --tail=100

# Başarısız login denemelerini kontrol edin
# Ayarlar → Güvenlik panelinden
```

## 🟡 Orta Seviye Riskler

### 1. JWT Token Kullanımı Yok
- **Mevcut:** localStorage tabanlı basit session
- **Risk:** XSS saldırılarına karşı savunmasız
- **Öneri:** JWT + HttpOnly cookies kullanın

### 2. İki Faktörlü Doğrulama (2FA) Yok
- **Risk:** Sadece şifre güvenliği
- **Öneri:** TOTP (Google Authenticator) ekleyin

### 3. Brute Force Koruması
- **Mevcut:** ✅ IP ban sistemi var
- **İyileştirme:** CAPTCHA ekleyin (5. denemeden sonra)

## ✅ İyi Uygulamalar

1. **Şifre Politikası**
   - Düzenli şifre değiştirme
   - Güçlü şifre kullanımı
   - Şifre karmaşıklığı gereksinimleri ekleyin

2. **Erişim Kontrolü**
   - IP whitelist kullanabilirsiniz
   - VPN üzerinden erişim
   - Sadece local network erişimi

3. **Veritabanı Güvenliği**
   - Düzenli yedekleme
   - Yedekleri farklı konumda saklayın
   - Yedekleri şifreleyin

4. **Container Security**
   - Container'ları non-root user ile çalıştırın
   - Image'leri düzenli güncelleyin
   - Güvenlik taramaları yapın

## 🆘 Güvenlik Olayı Durumunda

### Şüpheli Aktivite Tespit Edilirse:

```bash
1. Tüm banlı IP'leri kontrol edin
   Ayarlar → Güvenlik → Banlı IP Listesi

2. Login attempt loglarını inceleyin
   docker-compose logs backend | grep "login"

3. Şifreyi hemen değiştirin
   Ayarlar → Şifre Değiştir

4. Tüm session'ları sonlandırın
   - Uygulamayı yeniden başlatın
   docker-compose restart

5. Veritabanını yedekleyin
   cp backend/data.db backup-emergency-$(date +%Y%m%d-%H%M%S).db
```

### Şifre Unutulursa:

```bash
# Backend container'a bağlan
docker exec -it helper-app-backend /bin/sh

# Node ile şifre resetle
node -e "
const bcrypt = require('bcrypt');
const db = require('better-sqlite3')('/app/data.db');
const newPassword = '632536'; // Yeni şifre
bcrypt.hash(newPassword, 10, (err, hash) => {
  db.prepare('UPDATE auth SET password_hash = ? WHERE id = 1').run(hash);
  console.log('Şifre sıfırlandı: ' + newPassword);
});
"
```

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

**Son Güncelleme:** 2025-10-31  
**Güvenlik Seviyesi:** Orta-Yüksek (Ev kullanımı için yeterli, production için ek önlemler gerekli)

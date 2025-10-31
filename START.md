# 🚀 Hızlı Başlangıç

## Windows'da Test Etme

Windows'da `better-sqlite3` build problemi yaşanabilir. En kolay çözüm Docker kullanmak:

### 1. Docker Desktop'ı çalıştırın

### 2. Uygulamayı başlatın:
```powershell
docker-compose up --build
```

### 3. Tarayıcıda açın:
- Frontend: http://localhost:8080
- Varsayılan şifre: **12345**

### Durdurma:
```powershell
docker-compose down
```

## Unraid'de Kurulum

1. Projeyi Unraid'e kopyalayın:
```bash
cd /mnt/user/appdata
# Dosyaları buraya kopyalayın
```

2. Çalıştırın:
```bash
cd /mnt/user/appdata/helper-app
docker-compose up -d --build
```

3. Erişin:
- http://UNRAID-IP:8080

## Önemli Notlar

- **Veritabanı**: `backend/data.db` otomatik oluşur
- **Yüklenen dosyalar**: `backend/uploads/` klasöründe saklanır
- **Yedekleme**: Bu iki klasörü düzenli yedekleyin
- **Şifre**: İlk girişte mutlaka değiştirin!

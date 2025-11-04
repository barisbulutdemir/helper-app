# Android Build Rehberi

Bu rehber, helper-app projesini Android APK olarak build etmek için gereken adımları içerir.

## 📋 Gereksinimler

1. **Android Studio** (ücretsiz)
   - [Android Studio İndir](https://developer.android.com/studio)
   - Android SDK ve Build Tools kurulu olmalı

2. **Java JDK 17+**
   - Android Studio ile birlikte gelir

3. **Node.js ve npm** (zaten kurulu)

## 🚀 İlk Kurulum

### 1. Projeyi Build Et
```bash
npm run build
```

### 2. Android Platformunu Sync Et
```bash
npm run android:sync
```

Bu komut:
- `dist/` klasöründeki web dosyalarını Android projesine kopyalar
- Capacitor konfigürasyonunu günceller

### 3. Android Studio'da Aç
```bash
npm run android:open
```

Veya manuel olarak:
- Android Studio'yu aç
- "Open an Existing Project" seç
- `android/` klasörünü seç

## 🔨 APK Build Etme

### Debug APK (Test için)
1. Android Studio'yu aç (`npm run android:open`)
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK dosyası: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (Production için)

#### 1. Keystore Oluştur
```bash
keytool -genkey -v -keystore helper-app-release.keystore -alias helper-app -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Android Studio'da Release Build
1. **Build** → **Generate Signed Bundle / APK**
2. **APK** seç
3. Keystore dosyasını ve şifresini gir
4. **release** build variant seç
5. Build tamamlandığında APK: `android/app/build/outputs/apk/release/app-release.apk`

## 📱 API URL Konfigürasyonu

Android uygulaması varsayılan olarak production backend'i kullanır: `https://tech.barisbd.tr`

Farklı bir backend kullanmak için:

1. `.env` dosyası oluştur (root dizinde):
```env
VITE_API_URL=https://your-backend-url.com
```

2. Yeniden build et:
```bash
npm run build
npm run android:sync
```

## 🔄 Güncelleme İşlemi

Web kodunda değişiklik yaptıktan sonra:

```bash
# 1. Web'i build et
npm run build

# 2. Android'e sync et
npm run android:sync

# 3. Android Studio'da yeniden build et
npm run android:open
```

## 📝 Notlar

- `android/` klasörü `.gitignore`'da, git'e commit edilmez
- Her build sonrası `android:sync` çalıştırılmalı
- İlk kez açıldığında Android Studio Gradle sync yapabilir (5-10 dakika sürebilir)
- Emülatör veya gerçek cihazda test edebilirsiniz

## 🐛 Sorun Giderme

### "Gradle sync failed"
- Android Studio'yu kapatıp yeniden aç
- **File** → **Invalidate Caches / Restart**

### "SDK not found"
- Android Studio'da **Tools** → **SDK Manager**
- Android SDK ve Build Tools kurulu olduğundan emin ol

### API bağlantı hatası
- Cihazın internet bağlantısını kontrol et
- Backend URL'inin doğru olduğundan emin ol
- Production backend'in çalıştığından emin ol

## 📦 APK Yükleme

APK'yı Android cihaza yüklemek için:

1. APK dosyasını cihaza kopyala (USB, email, cloud vb.)
2. Cihazda **Ayarlar** → **Güvenlik** → **Bilinmeyen kaynaklardan yükleme** aktif et
3. APK dosyasına dokun ve yükle

## 🔐 Güvenlik

- Release keystore dosyasını **güvenli bir yerde sakla**
- Keystore şifresini kaybetme (APK güncellemeleri için gerekli)
- Production APK'ları test etmeden dağıtma


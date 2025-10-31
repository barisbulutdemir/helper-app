import db from '../database.js';

// IP ban kontrolü middleware
export const checkBannedIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  // Banlı IP'leri kontrol et
  const bannedIP = db.prepare('SELECT * FROM banned_ips WHERE ip_address = ?').get(clientIP);
  
  if (bannedIP) {
    // Eğer geçici ban ise ve süresi dolmuşsa, banı kaldır
    if (bannedIP.banned_until) {
      const now = new Date();
      const bannedUntil = new Date(bannedIP.banned_until);
      
      if (now > bannedUntil) {
        db.prepare('DELETE FROM banned_ips WHERE ip_address = ?').run(clientIP);
        return next();
      }
    }
    
    return res.status(403).json({ 
      error: 'IP adresiniz engellenmiştir',
      banned_at: bannedIP.banned_at,
      banned_until: bannedIP.banned_until
    });
  }
  
  next();
};

// Login attempt tracker
export const trackLoginAttempt = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  // Son 15 dakikadaki başarısız login denemelerini say
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const attempts = db.prepare(
    'SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND success = 0 AND attempt_time > ?'
  ).get(clientIP, fifteenMinutesAgo);
  
  const settings = db.prepare('SELECT max_login_attempts FROM settings WHERE id = 1').get();
  const maxAttempts = settings?.max_login_attempts || 3;
  
  if (attempts.count >= maxAttempts) {
    // IP'yi banla
    const banDuration = settings?.ban_duration_hours || 24;
    const bannedUntil = new Date(Date.now() + banDuration * 60 * 60 * 1000).toISOString();
    
    try {
      db.prepare('INSERT INTO banned_ips (ip_address, ban_reason, banned_until) VALUES (?, ?, ?)').run(
        clientIP,
        `${maxAttempts} başarısız giriş denemesi`,
        bannedUntil
      );
    } catch (err) {
      // IP zaten banlı olabilir
    }
    
    return res.status(403).json({ 
      error: `Çok fazla başarısız deneme. IP adresiniz ${banDuration} saat boyunca engellenmiştir.`,
      banned_until: bannedUntil
    });
  }
  
  req.clientIP = clientIP;
  next();
};

// Login attempt logger
export const logLoginAttempt = (clientIP, success) => {
  db.prepare('INSERT INTO login_attempts (ip_address, success) VALUES (?, ?)').run(clientIP, success ? 1 : 0);
  
  // Eski kayıtları temizle (30 gün öncesi)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM login_attempts WHERE attempt_time < ?').run(thirtyDaysAgo);
};

// Client IP getter
export const getClientIP = (req) => {
  return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
};

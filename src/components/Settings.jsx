import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  
  // Settings state
  const [settings, setSettings] = useState({
    site_title: 'Tech Support',
    max_login_attempts: 3,
    ban_duration_hours: 24
  });
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // IP Ban state
  const [bannedIPs, setBannedIPs] = useState([]);
  const [newBanForm, setNewBanForm] = useState({
    ip_address: '',
    ban_reason: '',
    permanent: false
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchBannedIPs();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    }
  };

  const fetchBannedIPs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/banned-ips`);
      const data = await response.json();
      setBannedIPs(data);
    } catch (error) {
      console.error('Banlı IP listesi yüklenemedi:', error);
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ayarlar başarıyla güncellendi' });
        // Site title güncellendiyse tarayıcı başlığını güncelle
        document.title = settings.site_title;
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Güncelleme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bağlantı hatası' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Şifre değiştirilemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bağlantı hatası' });
    } finally {
      setLoading(false);
    }
  };

  const handleBanIP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/banned-ips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanForm)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'IP başarıyla banlandı' });
        setNewBanForm({ ip_address: '', ban_reason: '', permanent: false });
        fetchBannedIPs();
      } else {
        setMessage({ type: 'error', text: data.error || 'IP banlanamadı' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bağlantı hatası' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanIP = async (id) => {
    if (!confirm('Bu IP\'nin banını kaldırmak istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`${API_URL}/api/banned-ips/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'IP banı kaldırıldı' });
        fetchBannedIPs();
      } else {
        setMessage({ type: 'error', text: 'Ban kaldırılamadı' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bağlantı hatası' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Kalıcı';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">⚙️ Ayarlar</h2>

      {/* Section Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveSection('general')}
          className={`px-4 py-2 font-medium ${
            activeSection === 'general'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Genel Ayarlar
        </button>
        <button
          onClick={() => setActiveSection('password')}
          className={`px-4 py-2 font-medium ${
            activeSection === 'password'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Şifre Değiştir
        </button>
        <button
          onClick={() => setActiveSection('security')}
          className={`px-4 py-2 font-medium ${
            activeSection === 'security'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Güvenlik
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* General Settings */}
      {activeSection === 'general' && (
        <form onSubmit={handleSettingsUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Başlığı
            </label>
            <input
              type="text"
              value={settings.site_title}
              onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maksimum Başarısız Giriş Denemesi
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_login_attempts}
              onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Bu sayıda başarısız denemeden sonra IP banlanır
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ban Süresi (Saat)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.ban_duration_hours}
              onChange={(e) => setSettings({ ...settings, ban_duration_hours: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Otomatik ban süresi (maksimum 7 gün)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Güncelleniyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      {/* Password Change */}
      {activeSection === 'password' && (
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mevcut Şifre
            </label>
            <input
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yeni Şifre
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
          </button>
        </form>
      )}

      {/* Security - Banned IPs */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          {/* Ban IP Form */}
          <form onSubmit={handleBanIP} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-bold text-gray-800">Yeni IP Ban</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Adresi
              </label>
              <input
                type="text"
                value={newBanForm.ip_address}
                onChange={(e) => setNewBanForm({ ...newBanForm, ip_address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ban Nedeni
              </label>
              <input
                type="text"
                value={newBanForm.ban_reason}
                onChange={(e) => setNewBanForm({ ...newBanForm, ban_reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Spam, hacking denemesi vb."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="permanent"
                checked={newBanForm.permanent}
                onChange={(e) => setNewBanForm({ ...newBanForm, permanent: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="permanent" className="ml-2 text-sm text-gray-700">
                Kalıcı ban
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Banlanıyor...' : 'IP\'yi Banla'}
            </button>
          </form>

          {/* Banned IPs List */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Banlı IP Listesi ({bannedIPs.length})</h3>
            
            {bannedIPs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Banlı IP adresi bulunmuyor</p>
            ) : (
              <div className="space-y-2">
                {bannedIPs.map((ip) => (
                  <div
                    key={ip.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <p className="font-mono font-bold text-gray-800">{ip.ip_address}</p>
                      <p className="text-sm text-gray-600">{ip.ban_reason || 'Neden belirtilmemiş'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Banlandı: {formatDate(ip.banned_at)}
                        {ip.banned_until && ` | Bitiş: ${formatDate(ip.banned_until)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnbanIP(ip.id)}
                      className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                    >
                      Banı Kaldır
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

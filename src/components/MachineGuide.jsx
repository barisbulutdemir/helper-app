import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function MachineGuide() {
  const [guides, setGuides] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    solution: ''
  });
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' veya 'saved'

  useEffect(() => {
    fetchGuides();
  }, []);

  // Otomatik kaydetme (debounce ile)
  useEffect(() => {
    // Modal kapalıysa veya hem başlık hem çözüm boşsa kaydetme
    if (!showModal || (!formData.title && !formData.solution)) {
      return;
    }

    setSaveStatus('saving');
    
    const timeoutId = setTimeout(async () => {
      try {
        const dataToSend = {
          ...formData,
          problem: '' // Backend için uyumluluk
        };
        
        if (editingGuide) {
          // Mevcut rehber - güncelle
          await fetch(`${API_URL}/api/machine-guide/${editingGuide.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
        } else {
          // Yeni rehber - oluştur ve ID'yi kaydet
          const response = await fetch(`${API_URL}/api/machine-guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
          
          if (response.ok) {
            const newGuide = await response.json();
            setEditingGuide(newGuide); // Artık düzenleme moduna geç
          }
        }
        
        setSaveStatus('saved');
        fetchGuides(); // Listeyi güncelle
        
        // "Kaydedildi" mesajını 2 saniye sonra gizle
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (error) {
        console.error('Otomatik kaydetme hatası:', error);
        setSaveStatus('');
      }
    }, 2000); // 2 saniye sonra kaydet

    return () => clearTimeout(timeoutId);
  }, [formData, showModal, editingGuide]);

  const fetchGuides = async () => {
    try {
      const response = await fetch(`${API_URL}/api/machine-guide`);
      const data = await response.json();
      setGuides(data);
    } catch (error) {
      console.error('Rehber yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Backend 'problem' field'ini bekliyor (eski yapı), boş string gönder
    const dataToSend = {
      ...formData,
      problem: '' // Backend için uyumluluk
    };
    
    try {
      if (editingGuide) {
        const response = await fetch(`${API_URL}/api/machine-guide/${editingGuide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
          throw new Error('Güncelleme başarısız: ' + response.status);
        }
        
        console.log('✅ Rehber güncellendi');
      } else {
        const response = await fetch(`${API_URL}/api/machine-guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
          throw new Error('Kayıt başarısız: ' + response.status);
        }
        
        console.log('✅ Rehber oluşturuldu');
      }
      
      fetchGuides();
      closeModal();
    } catch (error) {
      console.error('❌ Rehber kaydedilemedi:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu rehberi silmek istediğinize emin misiniz?')) {
      try {
        await fetch(`${API_URL}/api/machine-guide/${id}`, { method: 'DELETE' });
        fetchGuides();
        if (editingGuide?.id === id) {
          closeModal();
        }
      } catch (error) {
        console.error('Rehber silinemedi:', error);
      }
    }
  };

  const openNewGuide = () => {
    setEditingGuide(null);
    setFormData({ title: '', solution: '' });
    setSaveStatus('');
    setShowModal(true);
  };

  const openEditGuide = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      solution: guide.solution
    });
    setSaveStatus('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGuide(null);
    setFormData({ title: '', solution: '' });
    setSaveStatus('');
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.solution.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🔧 Makina Rehberi</h2>
        <button
          onClick={openNewGuide}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          + Yeni Rehber Ekle
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Ara... (başlık veya çözümde)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="space-y-3">
        {filteredGuides.map(guide => (
          <div
            key={guide.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            onClick={() => openEditGuide(guide)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg mb-2 truncate">{guide.title}</h3>
                <div 
                  className="guide-preview text-gray-700 text-sm line-clamp-3 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: guide.solution || 'Çözüm yok...' }}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(guide.id);
                }}
                className="ml-4 text-red-500 hover:text-red-700 p-2"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz rehber eklenmemiş'}
        </p>
      )}

      {/* Modal - Yeni/Düzenle */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold">
                  {editingGuide ? 'Rehberi Düzenle' : 'Yeni Rehber Ekle'}
                </h2>
                {saveStatus === 'saving' && (
                  <span className="text-sm text-gray-500">Kaydediliyor...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-sm text-green-600">✓ Kaydedildi</span>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Başlık</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: TS-2 Hareket Etmiyor"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Çözüm</label>
                  <RichTextEditor
                    value={formData.solution}
                    onChange={(value) => setFormData({ ...formData, solution: value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    {editingGuide ? 'Güncelle' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    İptal
                  </button>
                  {editingGuide && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingGuide.id)}
                      className="ml-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MachineGuide;

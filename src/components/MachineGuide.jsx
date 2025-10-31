import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import { apiFetch } from '../utils/api';

function MachineGuide() {
  const [guides, setGuides] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    solution: '',
    tag_ids: []
  });
  const [tagFormData, setTagFormData] = useState({
    name: '',
    color: '#3B82F6'
  });
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' veya 'saved'

  useEffect(() => {
    fetchGuides();
    fetchTags();
  }, [selectedTagId]);

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
          await apiFetch(`/api/machine-guide/${editingGuide.id}`, {
            method: 'PUT',
            body: JSON.stringify(dataToSend)
          });
        } else {
          // Yeni rehber - oluştur ve ID'yi kaydet
          const response = await apiFetch('/api/machine-guide', {
            method: 'POST',
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
      const url = selectedTagId 
        ? `/api/machine-guide?tag_id=${selectedTagId}`
        : '/api/machine-guide';
      const response = await apiFetch(url);
      const data = await response.json();
      setGuides(data);
    } catch (error) {
      console.error('Rehber yüklenemedi:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiFetch('/api/machine-guide-tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Tagler yüklenemedi:', error);
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
        const response = await apiFetch(`/api/machine-guide/${editingGuide.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
          throw new Error('Güncelleme başarısız: ' + response.status);
        }
        
        console.log('✅ Rehber güncellendi');
      } else {
        const response = await apiFetch('/api/machine-guide', {
          method: 'POST',
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
        await apiFetch(`/api/machine-guide/${id}`, { method: 'DELETE' });
        fetchGuides();
        if (editingGuide?.id === id) {
          closeModal();
        }
      } catch (error) {
        console.error('Rehber silinemedi:', error);
      }
    }
  };

  const handleTagToggle = (tagId) => {
    const currentIds = formData.tag_ids || [];
    if (currentIds.includes(tagId)) {
      setFormData({ ...formData, tag_ids: currentIds.filter(id => id !== tagId) });
    } else {
      setFormData({ ...formData, tag_ids: [...currentIds, tagId] });
    }
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/machine-guide-tags', {
        method: 'POST',
        body: JSON.stringify(tagFormData)
      });
      
      if (response.ok) {
        fetchTags();
        setTagFormData({ name: '', color: '#3B82F6' });
        setShowTagModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Tag oluşturulamadı');
      }
    } catch (error) {
      console.error('Tag oluşturulamadı:', error);
      alert('Tag oluşturulamadı');
    }
  };

  const handleTagDelete = async (tagId) => {
    if (confirm('Bu tag\'i silmek istediğinize emin misiniz? Tüm rehberlerden de kaldırılacak.')) {
      try {
        await apiFetch(`/api/machine-guide-tags/${tagId}`, { method: 'DELETE' });
        fetchTags();
        fetchGuides();
      } catch (error) {
        console.error('Tag silinemedi:', error);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await apiFetch('/api/machine-guide/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `makine-rehberi-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Excel export başarısız');
      }
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('Excel export başarısız');
    }
  };

  const openNewGuide = () => {
    setEditingGuide(null);
    setFormData({ title: '', solution: '', tag_ids: [] });
    setSaveStatus('');
    setShowModal(true);
  };

  const openEditGuide = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      solution: guide.solution,
      tag_ids: guide.tags ? guide.tags.map(t => t.id) : []
    });
    setSaveStatus('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGuide(null);
    setFormData({ title: '', solution: '', tag_ids: [] });
    setSaveStatus('');
  };

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guide.solution && guide.solution.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (guide.tags && guide.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">🔧 Makina Rehberi</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowTagModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            🏷️ Tag Yönetimi
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            📊 Excel Export
          </button>
        <button
          onClick={openNewGuide}
            className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
        >
            + Yeni Rehber
        </button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base flex-shrink-0 sm:w-auto w-full"
          >
            <option value="">Tüm Tagler</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        <input
          type="text"
            placeholder="Ara... (başlık, çözüm veya tag)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base"
        />
        </div>
        {selectedTagId && (
          <button
            onClick={() => setSelectedTagId('')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Filtreyi temizle
          </button>
        )}
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
                {guide.tags && guide.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {guide.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}` }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
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
          {searchTerm || selectedTagId ? 'Arama sonucu bulunamadı' : 'Henüz rehber eklenmemiş'}
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
                  <label className="block font-semibold mb-2">Tagler</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                    {tags.map(tag => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 cursor-pointer px-3 py-1 rounded border"
                        style={{ 
                          backgroundColor: formData.tag_ids?.includes(tag.id) ? tag.color + '30' : 'transparent',
                          borderColor: tag.color
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleTagToggle(tag.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.tag_ids?.includes(tag.id) || false}
                          onChange={() => handleTagToggle(tag.id)}
                          className="cursor-pointer"
                        />
                        <span style={{ color: tag.color }}>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                  {tags.length === 0 && (
                    <p className="text-sm text-gray-500">Henüz tag oluşturulmamış. Tag Yönetimi butonundan tag oluşturun.</p>
                  )}
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

      {/* Tag Yönetimi Modal */}
      {showTagModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTagModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">🏷️ Tag Yönetimi</h2>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleTagSubmit} className="space-y-4 mb-6">
                <div>
                  <label className="block font-semibold mb-2">Tag Adı</label>
                  <input
                    type="text"
                    value={tagFormData.name}
                    onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                    placeholder="Örn: Elektronik, Mekanik, Yazılım"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Renk</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={tagFormData.color}
                      onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                      className="w-20 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tagFormData.color}
                      onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg"
                >
                  Tag Ekle
                </button>
              </form>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Mevcut Tagler</h3>
                <div className="space-y-2">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="px-3 py-1 rounded text-sm"
                          style={{ backgroundColor: tag.color + '30', color: tag.color, border: `1px solid ${tag.color}` }}
                        >
                          {tag.name}
                        </span>
                        <span className="text-sm text-gray-500">#{tag.color}</span>
                      </div>
                      <button
                        onClick={() => handleTagDelete(tag.id)}
                        className="text-red-500 hover:text-red-700 px-3 py-1"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Henüz tag oluşturulmamış</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MachineGuide;

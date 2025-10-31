import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

const API_URL = import.meta.env.VITE_API_URL || '';

function NotesSection() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' veya 'saved'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, []);

  // Otomatik kaydetme (debounce ile)
  useEffect(() => {
    // Modal kapalıysa veya hem başlık hem içerik boşsa kaydetme
    if (!showModal || (!title && !content)) {
      return;
    }

    setSaveStatus('saving');
    
    const timeoutId = setTimeout(async () => {
      try {
        if (editId) {
          // Mevcut not - güncelle
          await fetch(`${API_URL}/api/notes/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, category_id: categoryId })
          });
        } else {
          // Yeni not - oluştur ve ID'yi kaydet
          const response = await fetch(`${API_URL}/api/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, category_id: categoryId })
          });
          
          if (response.ok) {
            const newNote = await response.json();
            setEditId(newNote.id); // Artık düzenleme moduna geç
          }
        }
        
        setSaveStatus('saved');
        fetchNotes(); // Listeyi güncelle
        
        // "Kaydedildi" mesajını 2 saniye sonra gizle
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (error) {
        console.error('Otomatik kaydetme hatası:', error);
        setSaveStatus('');
      }
    }, 2000); // 2 saniye sonra kaydet

    return () => clearTimeout(timeoutId);
  }, [title, content, categoryId, showModal, editId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notes`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Notlar yüklenemedi:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/note-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editId) {
        await fetch(`${API_URL}/api/notes/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, category_id: categoryId })
        });
      } else {
        await fetch(`${API_URL}/api/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, category_id: categoryId })
        });
      }
      
      closeModal();
      fetchNotes();
    } catch (error) {
      console.error('Not kaydedilemedi:', error);
    }
  };

  const openModal = (note = null) => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setCategoryId(note.category_id || null);
      setEditId(note.id);
    } else {
      setTitle('');
      setContent('');
      setCategoryId(null);
      setEditId(null);
    }
    setSaveStatus('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTitle('');
    setContent('');
    setCategoryId(null);
    setEditId(null);
    setSaveStatus('');
  };

  const handleDelete = async (id) => {
    if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
      try {
        await fetch(`${API_URL}/api/notes/${id}`, { method: 'DELETE' });
        fetchNotes();
      } catch (error) {
        console.error('Not silinemedi:', error);
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/note-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor })
      });
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      fetchCategories();
    } catch (error) {
      console.error('Kategori oluşturulamadı:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Bu kategoriyi silmek istediğinize emin misiniz? (Notlar korunacak)')) {
      try {
        await fetch(`${API_URL}/api/note-categories/${id}`, { method: 'DELETE' });
        fetchCategories();
        fetchNotes();
      } catch (error) {
        console.error('Kategori silinemedi:', error);
      }
    }
  };

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || '';
  };

  const getCategoryColor = (id) => {
    return categories.find(c => c.id === id)?.color || '#3B82F6';
  };

  // Filtrelenmiş notlar
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === null || note.category_id === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">Notlar</h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 rounded text-xs sm:text-sm md:text-base transition flex items-center gap-1"
          >
            <span className="text-base sm:text-xl">📁</span> <span className="hidden sm:inline">Kategoriler</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 md:px-6 py-1 sm:py-2 rounded text-xs sm:text-sm md:text-base transition flex items-center gap-1"
          >
            <span className="text-base sm:text-xl">+</span> <span className="hidden sm:inline">Yeni Not</span>
          </button>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="mb-6 flex gap-2 sm:gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Not ara..."
          className="flex-1 px-2 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        <select
          value={selectedCategoryFilter || ''}
          onChange={(e) => setSelectedCategoryFilter(e.target.value ? parseInt(e.target.value) : null)}
          className="px-2 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-w-[100px] sm:min-w-[150px]"
          title="Kategori filtresi"
        >
          <option value="">Tüm Kat.</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Notlar Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            onClick={() => openModal(note)}
            className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer bg-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold line-clamp-1">{note.title}</h3>
                {note.category_id && (
                  <span 
                    className="text-xs px-2 py-1 rounded mt-1 inline-block"
                    style={{
                      backgroundColor: `${getCategoryColor(note.category_id)}20`,
                      color: getCategoryColor(note.category_id)
                    }}
                  >
                    {getCategoryName(note.category_id)}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                🗑️
              </button>
            </div>
            <div 
              className="note-preview text-gray-700 text-sm line-clamp-3 mt-2"
              dangerouslySetInnerHTML={{ __html: note.content || 'İçerik yok...' }}
            />
            <p className="text-xs text-gray-400 mt-3">
              {new Date(note.updated_at).toLocaleString('tr-TR')}
            </p>
          </div>
        ))}
        {filteredNotes.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-12">
            {searchTerm || selectedCategoryFilter ? 'Arama kriterlerine uygun not bulunamadı.' : 'Henüz not eklenmemiş. Yeni not eklemek için yukarıdaki butona tıklayın.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold">
                  {editId ? 'Notu Düzenle' : 'Yeni Not'}
                </h3>
                {saveStatus === 'saving' && (
                  <span className="text-sm text-gray-500">Kaydediliyor...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-sm text-green-600">✓ Kaydedildi</span>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Not Başlığı"
                className="w-full px-4 py-2 mb-4 border rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kategori Seçin (İsteğe Bağlı)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              <RichTextEditor
                value={content}
                onChange={setContent}
              />

              {/* Modal Footer */}
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
                >
                  {editId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kategori Yönetimi Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Kategori Yönetimi</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4">
              <form onSubmit={handleCreateCategory} className="mb-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Yeni kategori adı"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Renk:
                    </label>
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-16 h-10 border rounded-lg cursor-pointer"
                      title="Kategori rengi seçin"
                    />
                    <button
                      type="submit"
                      className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                    >
                      + Ekle
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Henüz kategori eklenmemiş</p>
                ) : (
                  categories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesSection;

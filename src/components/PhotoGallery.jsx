import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function PhotoGallery() {
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [visiblePhotos, setVisiblePhotos] = useState(20);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const observer = useRef();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      fetchPhotos(selectedCategory);
      setVisiblePhotos(20);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/photo-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const fetchPhotos = async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/api/photos?category_id=${categoryId}`);
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error('Fotoğraflar yüklenemedi:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/photo-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, parent_id: parentCategoryId })
      });
      setNewCategoryName('');
      setParentCategoryId(null);
      fetchCategories();
    } catch (error) {
      console.error('Kategori oluşturulamadı:', error);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !selectedCategory) {
      alert('Lütfen önce bir kategori seçin!');
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category_id', selectedCategory);

        await fetch(`${API_URL}/api/photos/upload`, {
          method: 'POST',
          body: formData
        });
      }
      fetchPhotos(selectedCategory);
    } catch (error) {
      console.error('Fotoğraf yüklenemedi:', error);
      alert('Fotoğraf yüklenemedi!');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Bu kategoriyi ve içindeki tüm alt kategoriler/fotoğrafları silmek istediğinize emin misiniz?')) {
      try {
        await fetch(`${API_URL}/api/photo-categories/${id}`, { method: 'DELETE' });
        fetchCategories();
        if (selectedCategory === id) {
          setSelectedCategory(null);
          setPhotos([]);
        }
      } catch (error) {
        console.error('Kategori silinemedi:', error);
      }
    }
  };

  const handleDeletePhoto = async (id) => {
    if (confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
      try {
        await fetch(`${API_URL}/api/photos/${id}`, { method: 'DELETE' });
        fetchPhotos(selectedCategory);
        setSelectedPhoto(null);
      } catch (error) {
        console.error('Fotoğraf silinemedi:', error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    
    if (confirm(`${selectedPhotos.length} fotoğrafı silmek istediğinize emin misiniz?`)) {
      try {
        for (const photoId of selectedPhotos) {
          await fetch(`${API_URL}/api/photos/${photoId}`, { method: 'DELETE' });
        }
        fetchPhotos(selectedCategory);
        setSelectedPhotos([]);
        setSelectionMode(false);
      } catch (error) {
        console.error('Fotoğraflar silinemedi:', error);
      }
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(photos.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPhotos([]);
  };

  const handleUpdateDescription = async (id, description) => {
    try {
      await fetch(`${API_URL}/api/photos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      fetchPhotos(selectedCategory);
    } catch (error) {
      console.error('Açıklama güncellenemedi:', error);
    }
  };

  // Lazy loading için intersection observer callback
  const lastPhotoRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visiblePhotos < photos.length) {
        setVisiblePhotos(prev => Math.min(prev + 20, photos.length));
      }
    });
    if (node) observer.current.observe(node);
  }, [photos.length, visiblePhotos]);

  // Kategori ağacını oluştur
  const buildCategoryTree = () => {
    const rootCategories = categories.filter(cat => !cat.parent_id);
    const childCategories = categories.filter(cat => cat.parent_id);
    
    return rootCategories.map(root => ({
      ...root,
      children: childCategories.filter(child => child.parent_id === root.id)
    }));
  };

  const renderCategoryTree = (categoryTree) => {
    return categoryTree.map(cat => (
      <div key={cat.id} className="mb-1">
        <div className="group relative flex items-center">
          <button
            onClick={() => {
              setSelectedCategory(cat.id);
              setPhotos([]);
            }}
            className={`flex-1 text-left px-3 py-2 rounded ${
              selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
          >
            📁 {cat.name}
          </button>
          <button
            onClick={() => {
              setParentCategoryId(cat.id);
            }}
            className="px-2 py-1 text-sm text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100"
            title="Alt kategori ekle"
          >
            +
          </button>
          <button
            onClick={() => handleDeleteCategory(cat.id)}
            className="px-2 py-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
            title="Sil"
          >
            ❌
          </button>
        </div>
        
        {/* Alt kategoriler */}
        {cat.children && cat.children.length > 0 && (
          <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-2">
            {cat.children.map(subCat => (
              <div key={subCat.id} className="group relative flex items-center mb-1">
                <button
                  onClick={() => {
                    setSelectedCategory(subCat.id);
                    setPhotos([]);
                  }}
                  className={`flex-1 text-left px-3 py-2 rounded text-sm ${
                    selectedCategory === subCat.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  📂 {subCat.name}
                </button>
                <button
                  onClick={() => handleDeleteCategory(subCat.id)}
                  className="px-2 py-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 text-sm"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  const categoryTree = buildCategoryTree();
  const visiblePhotosList = photos.slice(0, visiblePhotos);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📸 Fotoğraf Galerisi</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sol Sidebar - Kategoriler */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-3">Kategoriler</h3>
            
            {renderCategoryTree(categoryTree)}

            <form onSubmit={handleCreateCategory} className="mt-4 pt-4 border-t">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={parentCategoryId ? "Alt kategori adı" : "Yeni kategori adı"}
                className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                required
              />
              {parentCategoryId && (
                <div className="text-xs text-gray-600 mb-2">
                  Alt kategori: {categories.find(c => c.id === parentCategoryId)?.name}
                  <button
                    type="button"
                    onClick={() => setParentCategoryId(null)}
                    className="ml-2 text-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                + Kategori Ekle
              </button>
            </form>
          </div>
        </div>

        {/* Sağ Taraf - Fotoğraflar */}
        <div className="md:col-span-3">
          {selectedCategory === null ? (
            <div className="text-center text-gray-400 py-16">
              <p className="text-lg">👈 Lütfen bir kategori seçin</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        setSelectedPhotos([]);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        selectionMode 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectionMode ? '✓ Seçim Modu' : '☐ Çoklu Seç'}
                    </button>
                    {selectionMode && selectedPhotos.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                      >
                        🗑️ Seçilenleri Sil ({selectedPhotos.length})
                      </button>
                    )}
                  </div>
                </div>
                {selectionMode && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={selectAllPhotos}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                    >
                      Hepsini Seç
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Seçimi Temizle
                    </button>
                  </div>
                )}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700
                      hover:file:bg-green-100
                      file:cursor-pointer
                      disabled:opacity-50"
                  />
                </label>
                {uploading && <p className="text-green-500 mt-2">Yükleniyor...</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visiblePhotosList.map((photo, index) => (
                  <div
                    key={photo.id}
                    ref={index === visiblePhotosList.length - 1 ? lastPhotoRef : null}
                    className="group cursor-pointer"
                    onClick={() => {
                      if (selectionMode) {
                        togglePhotoSelection(photo.id);
                      } else {
                        setSelectedPhoto(photo);
                      }
                    }}
                  >
                    <div className={`relative overflow-hidden rounded-lg bg-gray-100 border-2 ${
                      selectedPhotos.includes(photo.id) ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {selectionMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedPhotos.includes(photo.id)}
                            onChange={() => togglePhotoSelection(photo.id)}
                            className="w-5 h-5 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      {photo.file_type?.startsWith('video/') ? (
                        <div className="relative w-full h-40 bg-gray-200 flex items-center justify-center">
                          <video
                            src={`${API_URL}${encodeURI(photo.file_path)}`}
                            className="w-full h-40 object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
                            <span className="text-white text-4xl">▶️</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={`${API_URL}${encodeURI(photo.file_path)}`}
                            alt={photo.original_name}
                            className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="eager"
                            onError={(e) => {
                              console.error('❌ Fotoğraf yüklenemedi:', `${API_URL}${photo.file_path}`);
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160"%3E%3Crect fill="%23fee" width="200" height="160"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23dc2626" font-family="Arial" font-size="14"%3EYuklenemedi%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-0 group-hover:bg-opacity-40">
                            <span className="text-white text-2xl">🔍</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {photo.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate px-1">
                        {photo.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {photos.length === 0 && (
                <p className="text-center text-gray-400 py-8">Bu kategoride henüz fotoğraf yok</p>
              )}

              {visiblePhotos < photos.length && (
                <div className="text-center mt-6">
                  <p className="text-gray-500">Daha fazla fotoğraf yükleniyor...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal - Fotoğraf Detayı */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedPhoto.file_type?.startsWith('video/') ? (
              <video
                src={`${API_URL}${encodeURI(selectedPhoto.file_path)}`}
                controls
                className="w-full max-h-[70vh] object-contain bg-black"
              />
            ) : (
              <img
                src={`${API_URL}${encodeURI(selectedPhoto.file_path)}`}
                alt={selectedPhoto.original_name}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
            )}
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">{selectedPhoto.original_name}</h3>
              <textarea
                defaultValue={selectedPhoto.description || ''}
                onBlur={(e) => handleUpdateDescription(selectedPhoto.id, e.target.value)}
                placeholder="Açıklama ekle..."
                className="w-full px-3 py-2 border rounded-lg mb-4"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                >
                  Kapat
                </button>
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;

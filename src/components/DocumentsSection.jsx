import { useState, useEffect } from 'react';
import { apiFetch, API_URL } from '../utils/api';

function DocumentsSection() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await apiFetch('/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Dökümanlar yüklenemedi:', error);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      fetchDocuments();
    } catch (error) {
      console.error('Dosya yüklenemedi:', error);
      alert('Dosya yüklenemedi!');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu dökümanı silmek istediğinize emin misiniz?')) {
      try {
        await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
        fetchDocuments();
      } catch (error) {
        console.error('Döküman silinemedi:', error);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dökümanlar</h2>
      
      <div className="mb-6">
        <label className="block">
          <span className="sr-only">Dosya seç</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              file:cursor-pointer
              disabled:opacity-50"
          />
        </label>
        {uploading && <p className="text-blue-500 mt-2">Yükleniyor...</p>}
      </div>

      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">📄</span>
              <div>
                <a
                  href={`${API_URL}${doc.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {doc.original_name}
                </a>
                <p className="text-xs text-gray-500">
                  {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              🗑️
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-center text-gray-400 py-8">Henüz döküman yüklenmemiş</p>
        )}
      </div>
    </div>
  );
}

export default DocumentsSection;

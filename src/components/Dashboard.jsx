import { useState, useRef } from 'react';
import NotesSection from './NotesSection';
import TodoSection from './TodoSection';
import DocumentsSection from './DocumentsSection';
import PhotoGallery from './PhotoGallery';
import MachineGuide from './MachineGuide';
import Settings from './Settings';

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('notes');
  const menuRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const tabs = [
    { id: 'notes', label: '📝 Notlar & İşler', component: <NotesSection /> },
    { id: 'todos', label: '✅ Yapılacaklar', component: <TodoSection /> },
    { id: 'documents', label: '📄 Dökümanlar', component: <DocumentsSection /> },
    { id: 'photos', label: '📸 Fotoğraf Galerisi', component: <PhotoGallery /> },
    { id: 'guide', label: '🔧 Makina Rehberi', component: <MachineGuide /> },
    { id: 'settings', label: '⚙️ Ayarlar', component: <Settings /> }
  ];

  // Drag-to-scroll fonksiyonları
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - menuRef.current.offsetLeft;
    scrollLeft.current = menuRef.current.scrollLeft;
    menuRef.current.style.cursor = 'grabbing';
    menuRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (menuRef.current) {
      menuRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (menuRef.current) {
      menuRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - menuRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Hız çarpanı
    menuRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Touch event'leri (mobil için)
  const handleTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches[0].pageX - menuRef.current.offsetLeft;
    scrollLeft.current = menuRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const x = e.touches[0].pageX - menuRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    menuRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex justify-between items-center">
          <h1 className="text-sm sm:text-xl md:text-2xl font-bold text-gray-800">🔧 Teknik Servis Yardımcı</h1>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded text-xs sm:text-base transition"
          >
            Çıkış
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div 
            ref={menuRef}
            className="flex overflow-x-auto border-b touch-scroll"
            style={{ cursor: 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

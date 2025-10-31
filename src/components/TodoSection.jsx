import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function TodoSection() {
  const [categories, setCategories] = useState([]);
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTodos();
  }, []);

  useEffect(() => {
    fetchTodos(selectedCategory);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/todo-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const fetchTodos = async (categoryId = null) => {
    try {
      const url = categoryId 
        ? `${API_URL}/api/todos?category_id=${categoryId}`
        : `${API_URL}/api/todos`;
      const response = await fetch(url);
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Yapılacaklar yüklenemedi:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/todo-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      setNewCategoryName('');
      setShowCategoryModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Kategori oluşturulamadı:', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Bu kategoriyi ve içindeki tüm görevleri silmek istediğinize emin misiniz?')) {
      try {
        await fetch(`${API_URL}/api/todo-categories/${id}`, { method: 'DELETE' });
        fetchCategories();
        if (selectedCategory === id) {
          setSelectedCategory(null);
        }
      } catch (error) {
        console.error('Kategori silinemedi:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, category_id: selectedCategory })
      });
      
      setTask('');
      fetchTodos(selectedCategory);
    } catch (error) {
      console.error('Görev eklenemedi:', error);
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completed ? 0 : 1 })
      });
      fetchTodos();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch (error) {
      console.error('Görev silinemedi:', error);
    }
  };

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || 'Tüm Görevler';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Yapılacak İşler</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sol Sidebar - Kategoriler */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Kategoriler</h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs sm:text-sm"
                title="Yeni kategori ekle"
              >
                +
              </button>
            </div>
            
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded mb-2 ${
                selectedCategory === null ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
              }`}
            >
              📋 Tüm Görevler
            </button>

            {categories.map(cat => (
              <div key={cat.id} className="group relative">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded mb-2 ${
                    selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  📋 {cat.name}
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ Taraf - Todo Listesi */}
        <div className="md:col-span-3">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              {selectedCategory ? getCategoryName(selectedCategory) : 'Tüm Görevler'}
            </h3>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Yeni görev ekle..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
              >
                Ekle
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {todos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id, todo.completed)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className={`flex-1 ${
                  todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
                }`}>
                  {todo.task}
                </span>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️
                </button>
              </div>
            ))}
            {todos.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                {selectedCategory ? 'Bu kategoride görev yok' : 'Henüz görev eklenmemiş'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Kategori Ekleme Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Yeni Kategori Ekle</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="flex-1 overflow-auto p-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Yeni kategori adı"
                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Kategori Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoSection;

import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getToken, removeToken } from './utils/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Session kontrolü (token ve auth flag)
    const auth = localStorage.getItem('auth');
    const token = getToken();
    if (auth === 'true' && token) {
      setIsAuthenticated(true);
    } else {
      // Token yoksa temizle
      if (auth === 'true') {
        localStorage.removeItem('auth');
        removeToken();
      }
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
    removeToken();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

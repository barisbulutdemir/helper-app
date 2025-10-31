const API_URL = import.meta.env.VITE_API_URL || '';

// Token'ı localStorage'dan al
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// Token'ı localStorage'a kaydet
export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Token'ı temizle
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

// Authenticated fetch helper
export const apiFetch = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    ...options.headers,
  };

  // FormData değilse JSON header'ı ekle
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Token varsa Authorization header'ı ekle
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // Token geçersizse veya süresi dolmuşsa
  if (response.status === 401 || response.status === 403) {
    removeToken();
    // Sayfayı yenileyerek login sayfasına yönlendir
    if (window.location.pathname !== '/') {
      window.location.reload();
    }
  }

  return response;
};

export { API_URL };


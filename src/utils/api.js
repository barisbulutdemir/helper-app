// Capacitor import (will be undefined in web)
import { Capacitor } from '@capacitor/core';

// API URL configuration
// In web: uses VITE_API_URL or empty (relative URLs)
// In Android: uses VITE_API_URL or default to production server
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // If running in Capacitor (Android/iOS) and no env URL, use production
  if (Capacitor.isNativePlatform()) {
    return 'https://tech.barisbd.tr'; // Production backend URL
  }
  
  // Web: use relative URLs (empty string)
  return '';
};

const API_URL = getApiUrl();

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


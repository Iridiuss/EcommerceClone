// src/utils/auth.js
export const getTokenFromCookies = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/token=([^;]+)/);
    return match ? match[1] : null;
  };
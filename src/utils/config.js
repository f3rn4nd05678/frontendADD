
export const getAppDomain = () => {
  if (import.meta.env.VITE_APP_DOMAIN) {
    return import.meta.env.VITE_APP_DOMAIN;
  }
  
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return 'http://192.168.0.10:5173';
};


export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'https://localhost:7173/api/';
};

/**
 * @param {string} qrToken - Token del código QR
 * @returns {string} URL completa
 */
export const generateClaimPrizeUrl = (qrToken) => {
  const domain = getAppDomain();
  return `${domain}/claim-prize?code=${qrToken}`;
};


export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'La Suerte',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'La Suerte - Sistema de Sorteos',
  domain: getAppDomain(),
  apiUrl: getApiUrl(),
};

export default config;
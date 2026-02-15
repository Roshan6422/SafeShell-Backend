export const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) return apiUrl;

    // Smart detection: Use localhost if on a local domain, otherwise Koyeb
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return "http://localhost:5000";

    return "https://valid-stacia-safeshell-26edef1b.koyeb.app";
};

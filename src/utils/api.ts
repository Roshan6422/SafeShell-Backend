export const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) return apiUrl;
    return `http://${window.location.hostname}:5000`;
};

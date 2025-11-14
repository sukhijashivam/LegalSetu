// vite.config.js
export default {
  // ...other config
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      // Uncomment below for production
      // '/api': 'https://legalsetu.onrender.com',
    }
  }
};

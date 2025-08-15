import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://a23db48ead06.ngrok-free.app',
        changeOrigin: true,
        secure: false,
        timeout: 30000, // Reduced timeout
        followRedirects: true,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Host': 'a23db48ead06.ngrok-free.app'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err.message);
            // Send a more helpful error response
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Backend connection failed', 
                message: 'Unable to connect to the backend server. Please check if your ngrok tunnel is running.' 
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

// FluidTube API Configuration
// When deployed on Vercel or Cloudflare, set VITE_API_URL in environment variables (e.g. https://your-railway-app.up.railway.app)
// In local development, defaults to "" which proxies through Vite to http://localhost:8000
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

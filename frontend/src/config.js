// FluidTube API Configuration
// Always use same-origin relative path "" so all requests route through:
// - Vite proxy in local dev (to http://localhost:8000)
// - Vercel rewrites in production (to active backend tunnel)
// This guarantees zero CORS issues, avoids stale build-time environment variable URLs,
// and ensures consistent behavior across all devices.
export const API_BASE_URL = "";

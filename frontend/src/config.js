// FluidTube API Configuration
// Always target canonical domain https://www.fluidtube.web.id in production to avoid apex domain 308 redirect CORS blocks
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : isLocalhost
    ? ""
    : "https://www.fluidtube.web.id";

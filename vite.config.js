import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3000";

  return {
    plugins: [react()],
    define: {
      __ENV__: JSON.stringify(mode),
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
        "/webhook": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});

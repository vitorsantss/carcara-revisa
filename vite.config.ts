import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const hostsNgrok = [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173, allowedHosts: hostsNgrok },
  preview: { allowedHosts: hostsNgrok },
});

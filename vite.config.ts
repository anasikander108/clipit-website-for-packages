import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Accept the names Supabase's Vercel integration creates (NEXT_PUBLIC_*) as well as VITE_*.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});

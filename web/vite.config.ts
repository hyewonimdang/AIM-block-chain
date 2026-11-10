import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 대시보드가 ../data/activity-log.json 을 직접 import 할 수 있게 허용
    fs: { allow: [".."] },
  },
});

import * as env from dotenv;

export default defineConfig({
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
  },
});

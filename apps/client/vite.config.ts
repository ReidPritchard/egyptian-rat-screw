import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		// For development, we want to ensure Vite's HMR works
		hmr: {
			// Allow server to proxy the HMR websocket connections
			clientPort: 3000,
		},
	},
	build: {
		outDir: "dist",
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});

import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: "http://localhost:8000",
		supportFile: false,
		defaultBrowser: "firefox:dev",
		experimentalStudio: true,
	},
});

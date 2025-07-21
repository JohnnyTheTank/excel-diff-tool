import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
	return {
		// GitHub Pages serves from a subdirectory, adjust base path accordingly
		base: process.env.NODE_ENV === "production" ? "/excel-diff-tool/" : "/",
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "."),
			},
		},
	};
});

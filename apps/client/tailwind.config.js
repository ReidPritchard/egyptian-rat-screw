import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/index.html"],
	theme: {
		extend: {
			aspectRatio: {
				"playing-card": "60 / 90",
			},
			keyframes: {
				appear: {
					"0%": {
						opacity: "0",
					},
					"100%": {
						opacity: "1",
					},
				},
				fadeInLeft: {
					"0%": {
						opacity: "0",
						transform: "translateX(-20px)",
					},
					"100%": {
						opacity: "1",
						transform: "translateX(0)",
					},
				},
				fadeInUp: {
					"0%": {
						opacity: "0",
						transform: "translateY(20px)",
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)",
					},
				},
				fadeInScale: {
					"0%": {
						opacity: "0",
						transform: "scale(0.9)",
					},
					"100%": {
						opacity: "1",
						transform: "scale(1)",
					},
				},
			},
			animation: {
				appear: "appear 0.5s ease-in-out",
				fadeInLeft: "fadeInLeft 0.3s ease-out",
				fadeInUp: "fadeInUp 0.5s ease-out",
				fadeInScale: "fadeInScale 0.3s ease-out",
			},
		},
	},
	plugins: [daisyui],
	daisyui: {
		themes: ["light", "dark", "autumn", "synthwave"],
	},
};

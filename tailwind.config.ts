import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201d",
        paper: "#f7f2ea",
        matcha: "#6f8f72",
        sumi: "#202725",
        sakura: "#d8a5aa",
        moon: "#f2d998"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 32, 29, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

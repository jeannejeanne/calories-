import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: { vif: "#FF4600" },
        framboise: "#FF0A54",
        ciel: "#00BFFF",
        jaune: "#FAEE05",
        creme: "#FFF8F5",
        prune: "#4A2C3F",
      },
      fontFamily: {
        titre: ["Fraunces", "Georgia", "serif"],
        logo: ["Pacifico", "cursive"],
        texte: ["Quicksand", "Nunito", "system-ui", "sans-serif"],
      },
      keyframes: {},
      borderRadius: { carte: "28px" },
      boxShadow: { doux: "0 8px 30px -8px rgba(255,10,84,0.25)" },
    },
  },
  plugins: [],
};
export default config;

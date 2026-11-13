import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { maroon: "#7a0f1f", deep: "#560a15", copper: "#c27a45", cream: "#fbf3ee", ink: "#2a1a1d", mut: "#6b5a5d", line: "#ecdcd5" },
      fontFamily: { sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;

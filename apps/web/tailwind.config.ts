import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#19231d",
        mist: "#f6f7f1",
        leaf: "#c6f6a4",
        pond: "#78d6b0",
        line: "#d4dccf",
        shell: "#f2f5ec"
      },
      boxShadow: {
        shell: "0 20px 40px rgba(18, 44, 30, 0.12)"
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "'PingFang SC'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

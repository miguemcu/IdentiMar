/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: "#0284C7",
          dark: "#0369A1",
          light: "#BAE6FD",
        },
        slate: {
          deep: "#1E293B",
          mid: "#475569",
          light: "#94A3B8",
        },
        surface: "#F4F6F8",
        card: "#FFFFFF",
        ocre: {
          DEFAULT: "#FCD34D",
          dark: "#F59E0B",
        },
        ochre: {
          DEFAULT: "#FCD34D",
          dark: "#F59E0B",
        },
        success: "#22C55E",
        warning: "#F97316",
        danger: "#EF4444",
      },
      fontFamily: {
        nunito: ["Nunito_700Bold"],
        "nunito-regular": ["Nunito_400Regular"],
        "nunito-semibold": ["Nunito_600SemiBold"],
        "nunito-bold": ["Nunito_700Bold"],
        "nunito-extrabold": ["Nunito_800ExtraBold"],
        "nunito-black": ["Nunito_900Black"],
        source: ["SourceSans3_400Regular"],
        "source-regular": ["SourceSans3_400Regular"],
        "source-medium": ["SourceSans3_500Medium"],
        "source-semibold": ["SourceSans3_600SemiBold"],
      },
    },
  },
  plugins: [],
};

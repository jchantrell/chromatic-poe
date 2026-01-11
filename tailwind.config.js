import plugin from "tailwindcss/plugin";

/**@type {import("tailwindcss").Config} */
module.exports = {
  darkMode: ["class", '[data-kb-theme="dark"]'],
  content: ["./app/frontend/**/*.{ts,tsx}", "./packages/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        fontin: ["Fontin", "sans-serif"],
      },
      colors: {
        border: "rgb(from var(--border) r g b / <alpha-value>)",
        input: "rgb(from var(--input) r g b / <alpha-value>)",
        ring: "rgb(from var(--ring) r g b / <alpha-value>)",
        background: "rgb(from var(--background) r g b / <alpha-value>)",
        foreground: "rgb(from var(--foreground) r g b / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(from var(--primary) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--primary-foreground) r g b / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(from var(--secondary) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--secondary-foreground) r g b / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(from var(--destructive) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--destructive-foreground) r g b / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(from var(--info) r g b / <alpha-value>)",
          foreground: "rgb(from var(--info-foreground) r g b / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(from var(--success) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--success-foreground) r g b / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(from var(--warning) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--warning-foreground) r g b / <alpha-value>)",
        },
        error: {
          DEFAULT: "rgb(from var(--error) r g b / <alpha-value>)",
          foreground: "rgb(from var(--error-foreground) r g b / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(from var(--muted) r g b / <alpha-value>)",
          foreground: "rgb(from var(--muted-foreground) r g b / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(from var(--accent) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--accent-foreground) r g b / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(from var(--popover) r g b / <alpha-value>)",
          foreground:
            "rgb(from var(--popover-foreground) r g b / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(from var(--card) r g b / <alpha-value>)",
          foreground: "rgb(from var(--card-foreground) r g b / <alpha-value>)",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--kb-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--kb-accordion-content-height)" },
          to: { height: 0 },
        },
        "content-show": {
          from: { opacity: 0, transform: "scale(0.96)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        "content-hide": {
          from: { opacity: 1, transform: "scale(1)" },
          to: { opacity: 0, transform: "scale(0.96)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "content-show": "content-show 0.2s ease-out",
        "content-hide": "content-hide 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addUtilities, matchUtilities, theme }) => {
      addUtilities({
        ".inset-center": {
          top: "50%",
          left: "50%",
          "@apply -translate-x-1/2 -translate-y-1/2": {},
        },
        ".inset-y-center": {
          top: "50%",
          "@apply -translate-y-1/2": {},
        },
        ".inset-x-center": {
          left: "50%",
          "@apply -translate-x-1/2": {},
        },
      });
      matchUtilities(
        {
          "scrollbar-thumb": (value) => ({
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: value,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: `color-mix(in srgb, ${value}, transparent 20%)`,
            },
          }),
        },
        { values: theme("colors"), type: "color" },
      );
    }),
  ],
};

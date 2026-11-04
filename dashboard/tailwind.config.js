/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // One charcoal ramp. Surfaces stay neutral, the content carries the colour.
        background: "#0b0b0d",
        surface: "#131315",
        raised: "#1a1a1d",
        line: "#26262a",
        ink: "#f2f2f0",
        ink2: "#a3a3a7",
        ink3: "#77777c",
        positive: "#4cc38a",
        negative: "#e5484d",
        // China marker red: the only accent, kept for the moment that is selected.
        marker: "#d9352c",
        // Neutral chrome accent so existing utilities resolve to the ramp.
        primary: "#f2f2f0",
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}

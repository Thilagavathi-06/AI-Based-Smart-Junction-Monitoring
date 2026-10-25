/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: "#070B18", // Main background
          800: "#0B1224", // Sidebar / cards
          700: "#0F1A34", // Elevated surfaces
          600: "#172554", // Borders / highlights
        },
        cyber: {
          blue: "#3B82F6",
          cyan: "#22D3EE",
          emerald: "#22C55E",
          amber: "#F59E0B",
          rose: "#EF4444",
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(34, 211, 238, 0.3)',
        'glow-blue': '0 0 15px -3px rgba(59, 130, 246, 0.3)',
        'glow-rose': '0 0 15px -3px rgba(239, 68, 68, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'flow-dash': 'dash 1.5s linear infinite',
      },
      keyframes: {
        dash: {
          to: {
            strokeDashoffset: '-20',
          },
        },
      },
    },
  },
  plugins: [],
}

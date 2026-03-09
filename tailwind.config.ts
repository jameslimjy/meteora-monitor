import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0b0e',
        card: '#111318',
        border: '#1e2028',
        'accent-orange': '#f97316',
        'accent-blue': '#3b82f6',
        'text-primary': '#f1f5f9',
        'text-secondary': '#64748b',
        live: '#22c55e',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-new': 'pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

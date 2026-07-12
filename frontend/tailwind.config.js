export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#111111',
        panelSoft: '#171717',
        panelMuted: '#202020',
        borderSoft: '#5e5e5e',
        accent: '#3f7f49',
        accentStrong: '#1f5f2a',
        danger: '#c96b6b',
        warning: '#d8a84d',
      },
      boxShadow: {
        sketch: '0 0 0 1px rgba(255,255,255,0.15), 0 20px 40px rgba(0,0,0,0.45)',
      },
      fontFamily: {
        hand: ['"Patrick Hand"', '"Segoe Print"', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
module.exports = {
  theme: {
    extend: { 
      animation: {
        'updown-dance': 'updown-dance  ease-in-out infinite', // Apply the keyframes here
      },
      keyframes: {
        'updown-dance': {
          '0%, 100%': { transform: 'translateY(0)' }, // Start and end position (down)
          '50%': { transform: 'translateY(-2rem)' }, // Mid position (up by 2rem, approx 32px)
        },
      },
    },
  },
  plugins: [],
};

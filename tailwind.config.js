/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#F7F4EF', // warm paper white
        card: '#FFFFFF',
        textPrimary: '#0D0D0D',
        textSecondary: '#9B9B8E',
        accent: '#FF3B00', // vermillion
        border: '#EBEBEB',
        darkBg: '#0D0D0D',
        trustBlue: '#0066FF',
        surfaceContainer: '#F0EDE8',
        // Support legacy mappings to prevent broken classes
        text: '#0D0D0D',
        dark: '#0D0D0D',
      },
      spacing: {
        'margin-page': '20px',
        '4.5': '18px',
      },
      fontFamily: {
        // Inter family only
        heroText: 'Inter_900Black',
        sectionLabel: 'Inter_700Bold',
        productName: 'Inter_500Medium',
        price: 'Inter_700Bold',
        bodyText: 'Inter_300Light',
        buttonText: 'Inter_700Bold',
        captionText: 'Inter_400Regular',
        // Fallbacks for standard weights
        black: 'Inter_900Black',
        bold: 'Inter_700Bold',
        semiBold: 'Inter_600SemiBold',
        medium: 'Inter_500Medium',
        regular: 'Inter_400Regular',
        light: 'Inter_300Light',
      },
      borderRadius: {
        DEFAULT: '0',
        'none': '0',
        'sm': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        'full': '0',
      },
      boxShadow: {
        DEFAULT: 'none',
        'none': 'none',
        'sm': 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
        '2xl': 'none',
      }
    },
  },
  plugins: [],
}

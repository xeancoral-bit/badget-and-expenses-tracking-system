/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0F172A',
                secondary: '#1E293B',
                accent: '#10B981',
                'accent-hover': '#059669',
                warning: '#F59E0B',
                danger: '#EF4444',
                'danger-hover': '#DC2626',
                border: '#334155',
                'border-light': '#475569',
                'text-primary': '#F8FAFC',
                'text-secondary': '#94A3B8',
                'text-muted': '#64748B',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

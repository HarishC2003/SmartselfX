/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#6366F1',
                secondary: '#0F172A',
                accent: '#22D3EE',
                background: '#0F172A',
                surface: '#1E293B',
                text: '#F1F5F9',
                success: '#22C55E',
                warning: '#F59E0B',
                danger: '#EF4444',
            }
        },
    },
    plugins: [],
}

import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './app.vue',
        './layouts/**/*.vue',
        './plugins/**/*.{js,ts}',
        './*.{vue,js,ts,jsx,tsx,html}',
        './pages/**/*.{vue,js,ts,jsx,tsx}',
        './components/**/*.{vue,js,ts,jsx,tsx}',
        './node_modules/tw-elements/js/**/*.js',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            //
        },
    },
    plugins: [
        forms,
    ],
};

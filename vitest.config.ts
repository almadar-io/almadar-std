import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['__tests__/**/*.test.ts', '**/__tests__/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/.orbital/**'],
        globals: true,
    },
});

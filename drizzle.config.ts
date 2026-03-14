import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    schema: './packages/backend/src/db/schema.ts',
    out: './packages/backend/src/db/migrations',
    dbCredentials: {
        url: '.openfiend/openfiend.db',
    },
});

import { defineConfig } from '@prisma/config';
import { loadEnvConfig } from '@next/env';

// Load env variables from .env.local
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

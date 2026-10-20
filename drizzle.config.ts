import type { Config } from 'drizzle-kit';

export default {
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './drizzle',
} satisfies Config;

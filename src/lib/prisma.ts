import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { loadEnvConfig } from '@next/env';
import { URL } from 'url';

// Make sure env configurations are loaded
loadEnvConfig(process.cwd());

const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/sr_rentals';
const parsedUrl = new URL(dbUrl);

// Initialize MariaDB connection adapter with parsed individual options
const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname || 'localhost',
  port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
  user: parsedUrl.username || 'root',
  password: decodeURIComponent(parsedUrl.password || ''),
  database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'sr_rentals',
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { loadEnvConfig } from '@next/env';
import { URL } from 'url';

// Make sure env configurations are loaded
loadEnvConfig(process.cwd());

function parseDatabaseUrl(urlStr?: string) {
  if (!urlStr) {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sr_rentals',
    };
  }

  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 3306,
      user: parsed.username || 'root',
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'sr_rentals',
    };
  } catch {
    // Fallback parser if URL has unencoded @ in password
    const match = urlStr.match(/^mysql:\/\/([^:]+):(.*)@([^:/]+)(?::(\d+))?\/(.+)$/);
    if (match) {
      return {
        user: match[1],
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: match[4] ? Number(match[4]) : 3306,
        database: match[5],
      };
    }
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sr_rentals',
    };
  }
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);

// Initialize MariaDB connection adapter with parsed individual options
const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: false,
  connectTimeout: 10000,
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

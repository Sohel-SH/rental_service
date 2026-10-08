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
      ssl: false as any,
    };
  }

  try {
    const parsed = new URL(urlStr);
    const sslParam = (parsed.searchParams.get('ssl-mode') || parsed.searchParams.get('sslmode') || '').toUpperCase();
    const isRemote = parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1';
    const requireSsl = sslParam === 'REQUIRED' || sslParam === 'REQUIRE' || isRemote;

    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 3306,
      user: parsed.username || 'root',
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'sr_rentals',
      ssl: requireSsl ? { rejectUnauthorized: false } : false,
    };
  } catch {
    // Fallback parser if URL has unencoded @ in password
    const match = urlStr.match(/^mysql:\/\/([^:]+):(.*)@([^:/]+)(?::(\d+))?\/(.+)$/);
    if (match) {
      const host = match[3];
      const isRemote = host !== 'localhost' && host !== '127.0.0.1';
      const dbAndQuery = match[5].split('?');
      const dbName = dbAndQuery[0];
      const hasSslQuery = dbAndQuery[1] ? /ssl[-_]?mode=require/i.test(dbAndQuery[1]) : false;
      return {
        user: match[1],
        password: decodeURIComponent(match[2]),
        host: host,
        port: match[4] ? Number(match[4]) : 3306,
        database: dbName,
        ssl: (isRemote || hasSslQuery) ? { rejectUnauthorized: false } : false,
      };
    }
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sr_rentals',
      ssl: false as any,
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
  ssl: dbConfig.ssl,
  connectTimeout: 15000,
  connectionLimit: 10,
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

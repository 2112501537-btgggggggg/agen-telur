const { PrismaClient } = require('../generated/prisma');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Simple parsing of mysql://root:password@localhost:3306/egg_shop
const match = dbUrl.match(/mysql:\/\/([^:]*):([^@]*)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  throw new Error("Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database");
}

const [, user, password, host, port, database] = match;

const adapter = new PrismaMariaDb({
  host,
  port: parseInt(port, 10),
  user: decodeURIComponent(user),
  password: decodeURIComponent(password),
  database,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;

const prisma = require('../utils/prisma');

async function getConfig() {
  const config = await prisma.membershipConfig.findUnique({
    where: { id: 1 },
  });

  if (!config) {
    const err = new Error('Config belum di-set di database. Hubungi developer.');
    err.status = 500;
    throw err;
  }

  return config;
}

async function updateConfig(data) {
  const existing = await prisma.membershipConfig.findUnique({
    where: { id: 1 },
  });

  if (!existing) {
    const err = new Error('Config belum di-set di database. Hubungi developer.');
    err.status = 500;
    throw err;
  }

  return prisma.membershipConfig.update({
    where: { id: 1 },
    data,
  });
}

module.exports = {
  getConfig,
  updateConfig,
};

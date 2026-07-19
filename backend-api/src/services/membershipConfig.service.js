const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

async function getConfig() {
  const config = await prisma.membershipConfig.findUnique({
    where: { id: 1 },
  });

  if (!config) {
    throw new AppError(500, 'Config belum di-set di database. Hubungi developer.');
  }

  return config;
}

async function updateConfig(data) {
  const existing = await prisma.membershipConfig.findUnique({
    where: { id: 1 },
  });

  if (!existing) {
    throw new AppError(500, 'Config belum di-set di database. Hubungi developer.');
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

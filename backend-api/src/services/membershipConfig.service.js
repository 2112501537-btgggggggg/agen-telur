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

/**
 * Get public membership info — only exposes non-sensitive fields.
 * Safe to call without authentication.
 */
async function getPublicMembershipInfo() {
  const config = await getConfig();
  return {
    pointsThresholdForMember: config.pointsThresholdForMember,
    memberDiscountPercent: config.memberDiscountPercent,
  };
}

module.exports = {
  getConfig,
  updateConfig,
  getPublicMembershipInfo,
};

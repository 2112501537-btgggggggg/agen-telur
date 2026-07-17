const prisma = require('../utils/prisma');

async function listUnitConversions() {
  return prisma.unitConversion.findMany({
    orderBy: { unit: 'asc' },
  });
}

module.exports = {
  listUnitConversions,
};

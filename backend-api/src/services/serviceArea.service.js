const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

async function listActiveServiceAreas() {
  return prisma.serviceArea.findMany({
    where: { isActive: true },
    orderBy: [
      { city: 'asc' },
      { kecamatan: 'asc' },
    ],
  });
}

async function listAllServiceAreas() {
  return prisma.serviceArea.findMany({
    orderBy: [
      { city: 'asc' },
      { kecamatan: 'asc' },
    ],
  });
}

async function createServiceArea(data) {
  return prisma.serviceArea.create({
    data,
  });
}

async function updateServiceArea(id, data) {
  const existing = await prisma.serviceArea.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Area layanan tidak ditemukan');
  }

  return prisma.serviceArea.update({
    where: { id },
    data,
  });
}

async function deleteServiceArea(id) {
  const existing = await prisma.serviceArea.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Area layanan tidak ditemukan');
  }

  return prisma.serviceArea.delete({
    where: { id },
  });
}

async function isAddressInServiceArea(city, kecamatan) {
  if (!city) return false;
  
  const activeAreas = await prisma.serviceArea.findMany({
    where: { isActive: true },
  });

  return activeAreas.some(sa => {
    const cityMatch = sa.city.trim().toLowerCase() === city.trim().toLowerCase();
    if (!cityMatch) return false;

    // If service area kecamatan is null, entire city is covered
    if (!sa.kecamatan || sa.kecamatan.trim() === '') {
      return true;
    }

    // If destination kecamatan matches
    if (kecamatan && sa.kecamatan.trim().toLowerCase() === kecamatan.trim().toLowerCase()) {
      return true;
    }

    return false;
  });
}

module.exports = {
  listActiveServiceAreas,
  listAllServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  isAddressInServiceArea,
};

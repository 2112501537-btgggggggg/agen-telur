const prisma = require('../utils/prisma');

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
    const err = new Error('Area layanan tidak ditemukan');
    err.status = 404;
    throw err;
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
    const err = new Error('Area layanan tidak ditemukan');
    err.status = 404;
    throw err;
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

const { serviceAreaSchema } = require('../validators/serviceArea.validator');
const serviceAreaService = require('../services/serviceArea.service');
const asyncHandler = require('../utils/asyncHandler');

const indexActive = asyncHandler(async (req, res) => {
    const areas = await serviceAreaService.listActiveServiceAreas();
    res.status(200).json({ success: true, data: areas });
});

const indexAll = asyncHandler(async (req, res) => {
    const areas = await serviceAreaService.listAllServiceAreas();
    res.status(200).json({ success: true, data: areas });
});

const store = asyncHandler(async (req, res) => {
    const validated = serviceAreaSchema.parse(req.body);
    const created = await serviceAreaService.createServiceArea(validated);
    res.status(201).json({ success: true, data: created });
});

const update = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = serviceAreaSchema.partial().parse(req.body);
    const updated = await serviceAreaService.updateServiceArea(id, validated);
    res.status(200).json({ success: true, data: updated });
});

const destroy = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await serviceAreaService.deleteServiceArea(id);
    res.status(200).json({ success: true, message: 'Area layanan berhasil dihapus' });
});

module.exports = {
  indexActive,
  indexAll,
  store,
  update,
  destroy,
};

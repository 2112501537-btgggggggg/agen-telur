const { serviceAreaSchema } = require('../validators/serviceArea.validator');
const serviceAreaService = require('../services/serviceArea.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function indexActive(req, res, next) {
  try {
    const areas = await serviceAreaService.listActiveServiceAreas();
    res.status(200).json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
}

async function indexAll(req, res, next) {
  try {
    const areas = await serviceAreaService.listAllServiceAreas();
    res.status(200).json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    const validated = serviceAreaSchema.parse(req.body);
    const created = await serviceAreaService.createServiceArea(validated);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = serviceAreaSchema.partial().parse(req.body);
    const updated = await serviceAreaService.updateServiceArea(id, validated);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await serviceAreaService.deleteServiceArea(id);
    res.status(200).json({ success: true, message: 'Area layanan berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  indexActive,
  indexAll,
  store,
  update,
  destroy,
};

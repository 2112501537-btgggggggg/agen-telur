const { supplierSchema } = require('../validators/supplier.validator');
const supplierService = require('../services/supplier.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function index(req, res, next) {
  try {
    const suppliers = await supplierService.listSuppliers();
    res.status(200).json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    const validated = supplierSchema.parse(req.body);
    const supplier = await supplierService.createSupplier(validated);
    res.status(201).json({ success: true, data: supplier });
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

    const validated = supplierSchema.partial().parse(req.body);
    const supplier = await supplierService.updateSupplier(id, validated);
    res.status(200).json({ success: true, data: supplier });
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

    await supplierService.deleteSupplier(id);
    res.status(200).json({ success: true, message: 'Supplier berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  store,
  update,
  destroy,
};

const { supplierSchema } = require('../validators/supplier.validator');
const supplierService = require('../services/supplier.service');
const asyncHandler = require('../utils/asyncHandler');

const index = asyncHandler(async (req, res) => {
    const suppliers = await supplierService.listSuppliers();
    res.status(200).json({ success: true, data: suppliers });
});

const store = asyncHandler(async (req, res) => {
    const validated = supplierSchema.parse(req.body);
    const supplier = await supplierService.createSupplier(validated);
    res.status(201).json({ success: true, data: supplier });
});

const update = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = supplierSchema.partial().parse(req.body);
    const supplier = await supplierService.updateSupplier(id, validated);
    res.status(200).json({ success: true, data: supplier });
});

const destroy = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await supplierService.deleteSupplier(id);
    res.status(200).json({ success: true, message: 'Supplier berhasil dihapus' });
});

module.exports = {
  index,
  store,
  update,
  destroy,
};

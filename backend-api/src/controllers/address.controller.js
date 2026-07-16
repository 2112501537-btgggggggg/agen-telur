const { addressSchema } = require('../validators/address.validator');
const addressService = require('../services/address.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function index(req, res, next) {
  try {
    const addresses = await addressService.listAddresses(req.user.id);
    res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    const validated = addressSchema.parse(req.body);
    const address = await addressService.createAddress(req.user.id, validated);
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = addressSchema.partial().parse(req.body);
    const address = await addressService.updateAddress(req.user.id, addressId, validated);
    res.status(200).json({ success: true, data: address });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await addressService.deleteAddress(req.user.id, addressId);
    res.status(200).json({ success: true, message: 'Alamat berhasil dihapus' });
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

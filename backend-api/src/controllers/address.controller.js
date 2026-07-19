const { addressSchema } = require('../validators/address.validator');
const addressService = require('../services/address.service');
const asyncHandler = require('../utils/asyncHandler');

const index = asyncHandler(async (req, res) => {
    const addresses = await addressService.listAddresses(req.user.id);
    res.status(200).json({ success: true, data: addresses });});

const store = asyncHandler(async (req, res) => {
    const validated = addressSchema.parse(req.body);
    const address = await addressService.createAddress(req.user.id, validated);
    res.status(201).json({ success: true, data: address });});

const update = asyncHandler(async (req, res) => {
    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = addressSchema.partial().parse(req.body);
    const address = await addressService.updateAddress(req.user.id, addressId, validated);
    res.status(200).json({ success: true, data: address });});

const destroy = asyncHandler(async (req, res) => {
    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await addressService.deleteAddress(req.user.id, addressId);
    res.status(200).json({ success: true, message: 'Alamat berhasil dihapus' });});

module.exports = {
  index,
  store,
  update,
  destroy,
};

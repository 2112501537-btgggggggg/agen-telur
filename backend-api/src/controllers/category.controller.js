const { categorySchema } = require('../validators/category.validator');
const categoryService = require('../services/category.service');
const asyncHandler = require('../utils/asyncHandler');

const index = asyncHandler(async (req, res) => {
    const categories = await categoryService.listCategories();
    res.status(200).json({ success: true, data: categories });});

const store = asyncHandler(async (req, res) => {
    const validated = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(validated);
    res.status(201).json({ success: true, data: category });});

const update = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const validated = categorySchema.parse(req.body);
    const category = await categoryService.updateCategory(id, validated);
    res.status(200).json({ success: true, data: category });});

const destroy = asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    await categoryService.deleteCategory(id);
    res.status(200).json({ success: true, message: 'Kategori berhasil dihapus' });});

module.exports = {
  index,
  store,
  update,
  destroy,
};

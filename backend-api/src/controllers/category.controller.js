const { categorySchema } = require('../validators/category.validator');
const categoryService = require('../services/category.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function index(req, res, next) {
  try {
    const categories = await categoryService.listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    const validated = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(validated);
    res.status(201).json({ success: true, data: category });
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

    const validated = categorySchema.parse(req.body);
    const category = await categoryService.updateCategory(id, validated);
    res.status(200).json({ success: true, data: category });
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

    await categoryService.deleteCategory(id);
    res.status(200).json({ success: true, message: 'Kategori berhasil dihapus' });
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

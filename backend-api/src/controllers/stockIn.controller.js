const { stockInSchema } = require('../validators/stockIn.validator');
const stockInService = require('../services/stockIn.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function store(req, res, next) {
  try {
    const validated = stockInSchema.parse(req.body);
    const stockIn = await stockInService.createStockIn(validated, req.user.id);
    res.status(201).json({ success: true, data: stockIn });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

async function index(req, res, next) {
  try {
    const history = await stockInService.listStockIn(req.query);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  store,
  index,
};

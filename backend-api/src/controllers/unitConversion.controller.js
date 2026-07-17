const unitConversionService = require('../services/unitConversion.service');

async function index(req, res, next) {
  try {
    const list = await unitConversionService.listUnitConversions();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
};

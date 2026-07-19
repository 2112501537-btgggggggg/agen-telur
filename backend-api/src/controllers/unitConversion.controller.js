const unitConversionService = require('../services/unitConversion.service');
const asyncHandler = require('../utils/asyncHandler');

const index = asyncHandler(async (req, res) => {
    const list = await unitConversionService.listUnitConversions();
    res.status(200).json({ success: true, data: list });
});

module.exports = {
  index,
};

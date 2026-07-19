const { membershipConfigSchema } = require('../validators/membershipConfig.validator');
const membershipConfigService = require('../services/membershipConfig.service');
const asyncHandler = require('../utils/asyncHandler');

const show = asyncHandler(async (req, res) => {
    const config = await membershipConfigService.getConfig();
    res.status(200).json({ success: true, data: config });
});

const update = asyncHandler(async (req, res) => {
    const validated = membershipConfigSchema.parse(req.body);
    const updated = await membershipConfigService.updateConfig(validated);
    res.status(200).json({ success: true, data: updated });
});

module.exports = {
  show,
  update,
};

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

const showPublic = asyncHandler(async (req, res) => {
    const info = await membershipConfigService.getPublicMembershipInfo();
    res.status(200).json({ success: true, data: info });
});

module.exports = {
  show,
  update,
  showPublic,
};

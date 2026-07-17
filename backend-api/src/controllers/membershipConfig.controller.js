const { membershipConfigSchema } = require('../validators/membershipConfig.validator');
const membershipConfigService = require('../services/membershipConfig.service');

function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function show(req, res, next) {
  try {
    const config = await membershipConfigService.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const validated = membershipConfigSchema.parse(req.body);
    const updated = await membershipConfigService.updateConfig(validated);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    next(err);
  }
}

module.exports = {
  show,
  update,
};

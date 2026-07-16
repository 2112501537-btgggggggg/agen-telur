const { registerSchema } = require('../validators/auth.validator');
const { registerUser } = require('../services/auth.service');

// helper to format Zod errors
function formatZodError(err) {
  return err.issues.map(e => ({ path: e.path.join('.'), message: e.message }));
}

async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: formatZodError(err) });
    }
    // Propagate to centralized error handler
    next(err);
  }
}

module.exports = { register };

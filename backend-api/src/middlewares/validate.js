function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err); // ZodError akan ditangkap errorHandler global
    }
  };
}

module.exports = validate;

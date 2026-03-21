export const validate = (schema) => async (req, res, next) => {
  try {
    const validData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace req properties with validated/sanitized data (e.g., parsing strings into numbers)
    req.body = validData.body;
    req.query = validData.query;
    req.params = validData.params;
    return next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.issues)
        ? err.issues
        : Array.isArray(err.errors)
          ? err.errors
          : [];
      const formattedErrors = issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors,
      });
    }
    return next(err);
  }
};

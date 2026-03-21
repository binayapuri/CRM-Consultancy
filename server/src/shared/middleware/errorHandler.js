// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map(val => val.message).join(', ') });
  }
  
  // Cast errors (e.g., invalid object ID)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // Generic errors
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(err.code && { code: err.code }),
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

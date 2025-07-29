const { logger } = require('./logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong'
    });
  }

  // Development error response
  res.status(err.status || 500).json({
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler }; 
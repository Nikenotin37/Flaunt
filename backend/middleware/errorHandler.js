function errorHandler(error, _req, res, _next) {
  console.error('[backend]', error);
  const status = Number(error.statusCode || error.status || 500);
  res.status(status >= 400 && status < 600 ? status : 500).json({
    success: false,
    error: status === 500 ? 'Internal server error' : error.message,
  });
}

module.exports = errorHandler;

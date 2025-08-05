import { logger, logError } from './logger.js';

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized to perform this action') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Error response formatter
export const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    message: error.message || 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
    ...(isDevelopment && { error: error }),
  };

  // Add request info in development
  if (isDevelopment && req) {
    errorResponse.request = {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user ? { id: req.user._id, role: req.user.role } : null,
    };
  }

  return errorResponse;
};

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logError(err, req);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Internal Server Error';
  }

  // Send error response
  res.status(error.statusCode).json(formatErrorResponse(error, req));
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
export const handleDatabaseError = (error, operation) => {
  if (error.name === 'ValidationError') {
    throw new ValidationError(error.message);
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    throw new ConflictError(`${field} already exists`);
  }
  
  if (error.name === 'CastError') {
    throw new NotFoundError('Invalid ID format');
  }
  
  // Log unexpected database errors
  logger.error(`Database error in ${operation}: ${error.message}`);
  throw new AppError('Database operation failed', 500);
};

// Cloudinary error handler
export const handleCloudinaryError = (error, operation) => {
  logger.error(`Cloudinary error in ${operation}: ${error.message}`);
  
  if (error.http_code === 400) {
    throw new ValidationError('Invalid image format or size');
  }
  
  if (error.http_code === 401) {
    throw new AppError('Image upload service unavailable', 503);
  }
  
  throw new AppError('Image upload failed', 500);
}; 
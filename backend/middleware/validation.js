import Joi from 'joi';

// Validation schemas
export const userValidation = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('seller', 'customer').default('customer')
  }),
  
  login: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required()
  })
};

export const productValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    description: Joi.string().min(10).max(1000).required().trim(),
    price: Joi.number().positive().precision(2).required(),
    category: Joi.string().min(2).max(50).required().trim(),
    stock: Joi.number().integer().min(0).required(),
    images: Joi.array().items(Joi.string()).min(1).max(10).required()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    description: Joi.string().min(10).max(1000).trim(),
    price: Joi.number().positive().precision(2),
    category: Joi.string().min(2).max(50).trim(),
    stock: Joi.number().integer().min(0),
    images: Joi.array().items(Joi.string()).min(1).max(10)
  })
};

// Validation middleware
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    console.log(`Validating ${property}:`, {
      fields: Object.keys(req[property] || {}),
      hasData: !!req[property]
    });
    
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      console.log('Validation error:', error.details);
      
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      const errorMessage = errorDetails.map(detail => `${detail.field}: ${detail.message}`).join(', ');
      
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errorDetails,
        errorMessage: errorMessage
      });
    }
    
    console.log('Validation passed');
    
    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Sanitization middleware
export const sanitize = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
}; 
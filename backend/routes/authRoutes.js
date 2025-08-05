// 📁 backend/routes/authRoutes.js
import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, userValidation } from '../middleware/validation.js';

const router = express.Router();

// Public routes with validation
router.post('/register', validate(userValidation.register), register);
router.post('/login', validate(userValidation.login), login);

// Protected routes
router.get('/me', protect, getMe);

export default router;
// routes/productRoutes.js
import express from "express";
import { 
  addProduct, 
  getAllProducts, 
  getSellerProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct,
  getProductStats,
  debugProducts
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate, productValidation } from "../middleware/validation.js";

const router = express.Router();

// Debug route (development only)
if (process.env.NODE_ENV !== 'production') {
  router.get("/debug/all", debugProducts);
}

// Public routes
router.route("/")
  .get(getAllProducts)
  .post(protect, validate(productValidation.create), addProduct);

// Protected routes
router.route("/seller")
  .get(protect, getSellerProducts);

router.route("/stats")
  .get(protect, getProductStats);

router.route("/:id")
  .get(getProduct)
  .put(protect, validate(productValidation.update), updateProduct)
  .delete(protect, deleteProduct);

export default router;
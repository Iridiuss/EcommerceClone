 // routes/productRoutes.js
import express from "express";
import { addProduct, getAllProducts, getSellerProducts, getProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.route("/").get(getAllProducts).post(protect, addProduct);
router.route("/seller").get(protect, getSellerProducts);
router.route("/:id").get(getProduct).put(protect, updateProduct).delete(protect, deleteProduct);

export default router;
export default function validateProduct(product) {
    return product.name && product.description && product.price && product.category && product.image;
  }
import express from 'express';
import ProductManager from './ProductManager'; // Adjust the path as necessary

const router = express.Router();
const productManager = new ProductManager();

// Create a new product
router.post('/product', async (req, res) => {
  try {
    const product = await productManager.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.id);
    res.status(200).json(product);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Update a product by ID
router.put('/products/:id', async (req, res) => {
  try {
    const product = await productManager.updateProduct(req.params.id, req.body);
    res.status(200).json(product);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Delete a product by ID
router.delete('/products/:id', async (req, res) => {
  try {
    const result = await productManager.deleteProduct(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Add a new variant to a product
router.post('/products/:id/variants', async (req, res) => {
  try {
    const product = await productManager.addVariant(req.params.id, req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an existing variant
router.put('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    const product = await productManager.updateVariant(req.params.productId, req.params.variantId, req.body);
    res.status(200).json(product);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Remove a variant from a product
router.delete('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    const product = await productManager.removeVariant(req.params.productId, req.params.variantId);
    res.status(200).json(product);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Get a specific variant by ID
router.get('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    const variant = await productManager.getVariant(req.params.productId, req.params.variantId);
    res.status(200).json(variant);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
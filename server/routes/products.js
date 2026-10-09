const express = require('express');
const router = express.Router();
const products = require('../data/products.json');

// GET /api/products
router.get('/', (req, res) => {
  let result = [...products];

  const { occasion, fabric, color, minPrice, maxPrice, page = 1, limit = 12, sort } = req.query;

  if (occasion) {
    result = result.filter(p => p.occasion.toLowerCase().includes(occasion.toLowerCase()));
  }
  if (fabric) {
    result = result.filter(p => p.fabric.toLowerCase().includes(fabric.toLowerCase()));
  }
  if (color) {
    result = result.filter(p => p.color.toLowerCase().includes(color.toLowerCase()));
  }
  if (minPrice) {
    result = result.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    result = result.filter(p => p.price <= Number(maxPrice));
  }

  // Sort
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  else if (sort === 'discount') result.sort((a, b) => b.discount - a.discount);
  else if (sort === 'newest') result.sort((a, b) => Number(b.id) - Number(a.id));

  const total = result.length;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const paginated = result.slice(start, end);

  res.json({
    products: paginated,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const path = require('path');
const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static images from client public folder in dev
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));

// API Routes
app.use('/api/products', productsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Viraasat API is running 🌸' });
});

app.listen(PORT, () => {
  console.log(`✅ Viraasat server running on http://localhost:${PORT}`);
});

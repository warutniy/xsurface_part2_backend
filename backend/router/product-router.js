const express = require('express');
const { upload } = require('../middleware/upload');
const ProductController = require('../controller/product-controller');

const router = express.Router();

router.post('/create_product', upload.array('images', 6), ProductController.createProduct);
router.get('/get_product', ProductController.getSelectedProducts);
router.get('/images', ProductController.getAllImages);
router.get('/images/:imagename', ProductController.getSelectedImage);

module.exports = router;
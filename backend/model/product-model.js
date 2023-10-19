const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    images: {
        type: Array,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    }
},
    { timestamps: true }
);

// Create Model
const ProductModel = mongoose.model("Product", ProductSchema);

// Export Model for another file use
module.exports = ProductModel;
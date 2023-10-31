const ProductModel = require('../model/product-model');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

dotenv.config();

//Init gfs
let gfs;
let gridfsBucket;

//Create mongo connection
const conn = mongoose.createConnection(process.env.DATABASE_URI);
//Open The Stream
conn.once('open', () => {

    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads',
    });
    
    //We work with Our Grid Stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log("MongoDB Connected Created");
});

class ProductController {

    createProduct = async (req, res) => {

        try {
            const images = req.files.map((image) => image.filename);
            const {
                productName,
                code,
                price
            } = req.body;

            // validate images
            if ( images.length === 0 ) {
                throw new Error('images is required');
            };
    
            // validate product name
            if ( productName.trim() === '' ) {
                throw new Error('product name is required');
            } else if ( productName.length > 16 ) {
                throw new Error('product name must not exceed 16 characters.');
            } else if ( productName.match(/\S/g).length < 4 ) {
                throw new Error('product name must be at least 4 characters.');
            };
    
            // validate code
            const validProductCode = /^[A-Za-z]{2}\-\d{4}$/;
            if ( code.trim() === '' ) {
                throw new Error('code is required');
            } else if ( !validProductCode.test(code) ) {
                throw new Error('code pattern must be XX-0000.');
            };
    
            // validate price
            const validPriceNumber = /^\d*\.?\d{0,2}$/;
            if ( price.trim() === '' ) {
                throw new Error('price is required');
            } else if ( !validPriceNumber.test(price) ) {
                throw new Error('price must be a number');
            };

            // change format code
            const formatCode = (code) => {
                const codeArray = code.split('');
                const validCodeString = /[A-Za-z]/;
                for ( let i = 0; i < codeArray.length; i++ ) {
                    if ( validCodeString.test(codeArray[i]) ) {
                        codeArray[i] = codeArray[i].toUpperCase();
                    };
                };

                return codeArray.join('');
            };
            const newCode = formatCode(code);

            // change format price
            const formatPrice = (num) => {
                const removeZeroPrice = (num) => {
                    const splitedNum = num.split('.');
                    if ( splitedNum[0] !== '' && splitedNum[0].length > 1 ) {
                        const intNumArray = splitedNum[0].split('');
                        while ( intNumArray.length > 1 && intNumArray[0] === '0' ) {
                            intNumArray.shift();
                        };
                        splitedNum[0] = intNumArray.join('');
                    };
            
                    return splitedNum.join('.');
                };
            
                const changedNum = removeZeroPrice(num);
                if ( changedNum.length === 1 ) {
                    if ( changedNum[0] === '.' ) {
                        const newNum = '0.00';
                        return newNum;
                    } else {
                        const newNum = changedNum[0] + '.00';
                        return newNum;
                    };
                } else {
                    if ( !changedNum.split('').includes('.') ) {
                        const newNum = changedNum + '.00';
                        return newNum;
                    } else {
                        if ( changedNum[0] === '.' ) {
                            if ( changedNum.length < 3 ) {
                                const newNum = '0' + changedNum + '0';
                                return newNum;
                            } else {
                                const newNum = '0' + changedNum;
                                return newNum;
                            };
                        } else if ( changedNum[changedNum.length - 1] === '.' ) {
                            const newNum = changedNum + '00';
                            return newNum;
                        } else {
                            if ( changedNum[changedNum.length - 2] === '.' ) {
                                const newNum = changedNum + '0';
                                return newNum;
                            } else {
                                const newNum = changedNum;
                                return newNum;
                            };
                        };
                    };
                };
            };
            const newPrice = formatPrice(price);

            const newProduct = new ProductModel({
                images,
                productName,
                code: newCode,
                price: newPrice
            });
            await newProduct.save();

            res.status(200).json({
                productId: newProduct._id,
                product_details: newProduct,
                message: 'Create Product Success',
                error: false
            });

        } catch (error) {
            console.log("An Error Occured: " + error.message);
            return res.status(404).send("An Error Occured: " + error.message);
        };
    };

    getSelectedProducts = async (req, res) => {

        try {
            const allProducts = await ProductModel.find();

            return res.status(200).json({ products: allProducts });

        } catch (error) {
            console.log("An Error Occured: " + error.message);
            return res.status(404).send("An Error Occured: " + error.message);
        };
    };

    getAllImages = async (req, res) => {

        try {
            const files = await gfs.files.find().toArray();

            // Check if files
            if ( !files || files.length === 0 ) {

                res.status(404).json({
                    message: "No files exist",
                });
            };

            // Files exist
            res.status(200).json(files);

        } catch (error) {
            console.log("An Error Occured: " + error.message);
            return res.status(404).send("An Error Occured: " + error.message);
        };
    };

    getSelectedImage = async (req, res) => {

        try {
            const file = await gfs.files.findOne({ filename: req.params.imagename });
            
            // Check if file
            if ( !file || file.length === 0 ) {

                console.log("There is no file");

                res.status(404).json({
                    message: "The Resource Does Not Exist , Invalid request",
                });
            };

            // Check if image
            if ( file.contentType === 'image/jpeg' || file.contentType === 'image/png' ) {
                // Read output to browser
                console.log("There is file");

                const readStream = gridfsBucket.openDownloadStream(file._id);
                // the response will be the file itself.
                readStream.pipe(res);

            } else {
                res.status(404).json({
                    message: "Not an image",
                });
            };

        } catch (error) {
            console.log("An Error Occured: " + error.message);
            return res.status(404).send("An Error Occured: " + error.message);
        };
    };

    getSelectedSearch = async (req, res) => {

        try {
            const result = await ProductModel.aggregate([
                {
                    '$search': {
                        'index': 'a_few_fields', 
                        'compound': {
                            'should': [
                            {
                                'text': {
                                    'query': req.query.term || ' ', 
                                    'path': 'productName', 
                                    'score': {
                                        'boost': {
                                            'value': 5
                                        }
                                    }, 
                                    'fuzzy': {
                                        'maxEdits': 1
                                    }
                                }
                            }, {
                                'text': {
                                    'query': req.query.term || ' ', 
                                    'path': 'code', 
                                    'fuzzy': {
                                        'maxEdits': 1
                                    }
                                }
                            }]
                        }, 
                        'highlight': {
                            'path': [
                                'productName',
                                'code'
                            ]
                        }
                    }
                }, {
                    '$project': {
                        'images': 1,
                        'productName': 1, 
                        'code': 1, 
                        'price': 1, 
                        'score': {
                            '$meta': 'searchScore'
                        }, 
                        'highlight': {
                            '$meta': 'searchHighlights'
                        }
                    }
                }, {
                    '$limit': 10
                }
            ]);

            res.status(200).json({
                products: result,
                term: req.query.term
            });

        } catch (error) {
            console.log("An Error Occured: " + error.message);
            return res.status(404).send("An Error Occured: " + error.message);
        };
    };

    getSelectedSuggestion = async (req, res) => {

        try {
            const result = await ProductModel.aggregate([
                {
                    '$search': {
                        'index': 'autocomplete_products', 
                        'autocomplete': {
                            'query': req.query.term || ' ', 
                            'path': 'productName', 
                            // 'fuzzy': {
                            //     'maxEdits': 1, 
                            //     'prefixLength': 1
                            // }
                        }
                    }
                }, {
                    '$project': {
                        '_id': 0, 
                        'productName': 1, 
                        'score': {
                            '$meta': 'searchScore'
                        }
                    }
                }, {
                    '$limit': 10
                }
            ]);

            res.status(200).json(result);

        } catch (error) {
            console.log("An Error Occured: " + error.message);
            return res.status(404).send("An Error Occured: " + error.message);
        };
    };
    
};

module.exports = new ProductController();
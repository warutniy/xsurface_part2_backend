const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const productRouter = require('./router/product-router');

dotenv.config();
const ipAddress = process.env.BACKEND_URL;
const port = process.env.BACKEND_PORT;
const app = express();
app.use(cors());

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).send('Welcome to the server!');
});
app.use('/product', productRouter);

const connect = async () => {

    try {
        await mongoose.connect(process.env.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.DATABASE_NAME,
            writeConcern: "majority",
            retryWrites: true,
            user: process.env.DATABASE_USER,
            pass: process.env.DATABASE_PASS
        });

        console.log("MongoDB Have Been Connected");

        app.listen(port || 3001, () => {
            console.log(`Web Application Server is running on ${ipAddress} port ${port}`);
            console.log(`Address: ${ipAddress}:${port}`);
        });
        
    } catch (error) {
        console.error('Error connecting to the database or starting the server:', error);
    }
};

connect();
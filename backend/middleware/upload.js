const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const storage = new GridFsStorage({
    url: process.env.DATABASE_URI,
    file: (req, file) => {
        //This is neccessary
        return new Promise((resolve, reject) => {
            //We will use crypto here to create the bytes from the file
            crypto.randomBytes(16, (error, buffer) => {
                if (error) {
                    return reject(error);
                };
                //We generate a file name
                const filename = buffer.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    //Name is same as stream
                    bucketName: 'uploads',
                };
                resolve(fileInfo);
            });
        });
    },
});

const upload = multer({ storage: storage });

module.exports = { upload };
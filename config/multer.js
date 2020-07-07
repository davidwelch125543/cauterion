// Multer stuff
global.multer = require('multer');
global.UPLOAD_MAX_FILE_SIZE = 1024 * 1024;
global.fse = require('fs-extra');
const path = require('path');

let storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const data = req.body;
        console.log('upload!!!!')
        console.log(data)
        const edit = !!data.id;

        let dir = path.join(__dirname, '../public/uploads/users');


        console.log('dir!!!!!')
        // console.log(dir)

        await fse.ensureDir(dir)

        cb(null, dir)
    },
    filename: function (req, file, cb) {
        console.log(file)
        cb(null, file.originalname) // already have got Date implemented in the name
    }
});


let upload = multer({
    storage: storage,
    // limits: {fileSize: UPLOAD_MAX_FILE_SIZE},
    fileFilter: function (req, file, cb) {
        console.log('file filter!!!!')
        let filetypes = /jpeg|jpg/;
        let mimetype = filetypes.test(file.mimetype);
        let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (!mimetype && !extname) {
            req.fileTypeError = {message: "The file has an invalid type"};
            return cb(null, false, req.fileTypeError)
        }
        cb(null, true);
    }
});
global.uploadProfileImg = upload.single('profile_img');
global.uploadTourImg = upload.single('upload_image');
global.uploadImages = upload.single('test_image');


const multer = require('multer');
const storageConfig = multer.memoryStorage();

module.exports = {
	uploader: (fileFilters, maxSize = 5 * 1000 * 1000) => {
		const fileFilter = (req, file, cb) => {
			if (fileFilters || ['image/jpg', 'image/jpg', 'image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) cb(null, true);
			else cb(null, false);
	  }
		return multer({ storage: storageConfig, fileFilter, limits: { fileSize: maxSize } });
	}
};

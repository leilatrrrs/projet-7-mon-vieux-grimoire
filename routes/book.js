const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const multer = require('../middleware/multer-config')
const bookCtrl = require('../controllers/book')

// les routes ...

router.post('/:id/rating', auth, bookCtrl.rateBook);
router.post('/',auth,multer, bookCtrl.createBook);


router.get('/',bookCtrl.getBooks );
router.get('/:id',bookCtrl.getOneBook);

router.put('/:id',auth,multer,bookCtrl.modifyBook);

router.delete('/:id',auth,bookCtrl.deleteBook);



module.exports = router;
import express from 'express'
import { isAdmin, isAuthenticated } from '../middleware/isAuthencated.js';
import { addProduct, deleteProduct, getAllProduct, searchProduct, updateProduct } from '../controllers/productControler.js';
import { multipleUpload } from '../middleware/multer.js';


const router = express.Router()

router.post('/add', isAuthenticated, isAdmin, multipleUpload, addProduct) // image add karava mate multipleupload add kari deva nu // multer install kari didhu chhe 
router.get('/getallproduct', getAllProduct)
router.delete('/delete/:productId', isAuthenticated, isAdmin, deleteProduct)
router.put('/update/:productId', isAuthenticated, isAdmin, multipleUpload, updateProduct)
router.get('/search',searchProduct)




export default router;  

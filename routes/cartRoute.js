import express from 'express'
// import { isAuthenticated } from '../middleware/isAuthencated.js';
import { isAuthenticated } from '../middleware/isAuthencated.js';
import { addToCart, getCart, removeFromCart, updatequantity } from '../controllers/cartControler.js';


const router = express.Router()

router.get('/', isAuthenticated, getCart)
router.post('/add', isAuthenticated, addToCart)
router.put('/update', isAuthenticated, updatequantity)
router.delete('/remove',isAuthenticated, removeFromCart)




export default router;  

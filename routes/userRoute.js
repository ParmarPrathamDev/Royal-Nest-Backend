import express from 'express'
import { register, verify, reVerify, login, logout, forgotPassword, veriyfOTP, changePassword, allUser, getUserById, updateUser } from '../controllers/userControler.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthencated.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify', verify)
router.post('/reverify', reVerify)
router.post('/login', login)
router.post('/logout', isAuthenticated, logout)
router.post('/forgot-Password', forgotPassword)
router.post('/verify-otp/:email', veriyfOTP)
router.post('/change-Password/:email', changePassword)
router.get('/all-user', isAuthenticated, isAdmin, allUser)
router.get('/get-user/:userId', getUserById)
router.put('/update/:id', isAuthenticated, updateUser)


export default router;  

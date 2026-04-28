import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/isAuthencated.js";
import { createOrder, getAllOrdersAdmin, getMyOrders, getSalesData, getUserOrders, verifyPayment } from "../controllers/orderControler.js";

const router = express.Router()

router.post("/create-order",isAuthenticated, createOrder)
router.post("/verify-payment",isAuthenticated, verifyPayment )
router.get("/myorders",isAuthenticated, getMyOrders )
router.get("/all",isAuthenticated,isAdmin, getAllOrdersAdmin)
router.get("/user-orders/:userId",isAuthenticated,isAdmin ,getUserOrders )
router.get("/sales",isAuthenticated,isAdmin ,getSalesData )

export default router;

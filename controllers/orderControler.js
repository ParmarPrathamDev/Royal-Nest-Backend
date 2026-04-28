import { count } from "console"
import razorpayInstance from "../config/razorPay.js"
import { Cart } from "../models/cartModel.js"
import { Order } from "../models/orderModel.js"
import crypto from "crypto"
import e from "express"
import { console } from "inspector"
import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";

// export const createOrder = async (req, res) => {
//     try {
//         const { products, amount, tax, shipping, currency } = req.body
//         const options = {
//             amount: Math.round(Number(amount) * 100), // paisa ma convert thase 
//             currency: currency || "INR",
//             receipt: `receipt_${Date.now()}`

//         }
//         const razorpayOrder = await razorpayInstance.orders.create(options)

//         // save order in data base 

//         const newOrder = new Order({
//             user: req.user._id,
//             products,
//             amount,
//             tax,
//             shipping,
//             currency,
//             status: "Pending",
//             razorpayOrderId: razorpayOrder.id
//         })

//         await newOrder.save()

//         res.json({
//             success: true,
//             order: razorpayOrder,
//             dbOrder: newOrder
//         })
//     } catch (error) {
//         console.log("❌ Error in Create Order:", error)
//         res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

export const createOrder = async (req, res) => {
    try {
        const { products, amount, tax, shipping, currency } = req.body

        // ✅ FINAL STOCK CHECK BEFORE CREATING ORDER
        for (const item of products) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            if (product.quantity === 0) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is out of stock`
                });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.quantity} items available for ${product.productName}`
                });
            }
        }

        const options = {
            amount: Math.round(Number(amount) * 100),
            currency: currency || "INR",
            receipt: `receipt_${Date.now()}`
        }

        const razorpayOrder = await razorpayInstance.orders.create(options)

        const newOrder = new Order({
            user: req.user._id,
            products,
            amount,
            tax,
            shipping,
            currency,
            status: "Pending",
            razorpayOrderId: razorpayOrder.id
        })

        await newOrder.save()

        res.json({
            success: true,
            order: razorpayOrder,
            dbOrder: newOrder
        })
    } catch (error) {
        console.log("❌ Error in Create Order:", error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// export const verifyPayment = async (req, res) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentFailed } = req.body
//         const userId = req.user._id

//         if (paymentFailed) {
//             const order = await Order.findOneAndUpdate(
//                 { razorpayOrderId: razorpay_order_id },
//                 { status: "Failed" },
//                 { new: true }
//             );
//             return res.status(400).json({ success: false, message: "Payment failed", order })
//         }
//         const sign = razorpay_order_id + "|" + razorpay_payment_id;
//         const expectedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_SECRET)
//             .update(sign.toString())
//             .digest("hex")

//         if (expectedSignature === razorpay_signature) {

//             const order = await Order.findOneAndUpdate(
//                 { razorpayOrderId: razorpay_order_id },
//                 {
//                     status: "Paid",
//                     razorpayPaymentId: razorpay_payment_id,
//                     razorpaySignature: razorpay_signature
//                 },
//                 { new: true }
//             );

//             // 🔻 ADD THIS PART
//             const orderData = await Order.findOne({ razorpayOrderId: razorpay_order_id });

//             if (orderData && orderData.products?.length > 0) {

//                 for (const item of orderData.products) {

//                     await Product.findByIdAndUpdate(
//                         item.productId,
//                         {
//                             $inc: { quantity: -Math.abs(item.quantity) }
//                         }
//                     );

//                 }
//             }
//             // 🛒 CART CLEAR
//             await Cart.findOneAndUpdate(
//                 { userId },
//                 { $set: { items: [], totalPrice: 0 } }
//             );

//             return res.json({
//                 success: true,
//                 message: "Payment Successful",
//                 order
//             });
//         }
//         else {
//             await Order.findOneAndUpdate(
//                 { razorpayOrderId: razorpay_order_id },
//                 { status: "Failed" },
//                 { new: true }
//             );
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid Signature"
//             })
//         }
//     } catch (error) {
//         console.error("❌ Error in Verify Payment:", error)
//         res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentFailed } = req.body
        const userId = req.user._id

        if (paymentFailed) {
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "Failed" },
                { new: true }
            );

            return res.status(400).json({
                success: false,
                message: "Payment failed",
                order
            });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex")

        if (expectedSignature === razorpay_signature) {

            const orderData = await Order.findOne({ razorpayOrderId: razorpay_order_id });

            if (!orderData) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (orderData.status === "Paid") {
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified",
                    order: orderData
                });
            }

            // ✅ atomic stock check + deduct
            for (const item of orderData.products) {
                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        quantity: { $gte: item.quantity }
                    },
                    {
                        $inc: { quantity: -item.quantity }
                    },
                    { new: true }
                );

                if (!updatedProduct) {
                    return res.status(400).json({
                        success: false,
                        message: "Product is out of stock or insufficient quantity available"
                    });
                }
            }

            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    status: "Paid",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature
                },
                { new: true }
            );

            await Cart.findOneAndUpdate(
                { userId },
                { $set: { items: [], totalPrice: 0 } }
            );

            return res.json({
                success: true,
                message: "Payment Successful",
                order
            });
        }
        else {
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "Failed" },
                { new: true }
            );

            return res.status(400).json({
                success: false,
                message: "Invalid Signature"
            });
        }

    } catch (error) {
        console.error("❌ Error in Verify Payment:", error)

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;   // ✅ FIX

        const orders = await Order.find({ user: userId })
            .populate("user", "firstName lastName email")
            .populate({
                path: "products.productId",
                select: "productName productImg productPrice"
            });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Error Fetching User Orders:", error);
        res.status(500).json({
            message: error.message
        });
    }
};


// admin can see all orders

export const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params; // useer id will conform URL

        const orders = await Order.find({ user: userId })
            .populate({
                path: "products.productId",
                select: "productName productPrice productImg"
            }) // fatch product details
            .populate("user", "firstName lastName email"); // fatch user info 

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        })
    } catch (error) {
        console.log("Error Fetching User Orders:", error)
        res.status(500).json({
            message: error.message
        })
    }
}

export const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("user", "firstName lastName email")  // populate user info
            .populate("products.productId", "productName productPrice") // populate product details

        res.json({
            success: true,
            count: orders.length,
            orders
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Failed to fetch all orders",
            error: error.message
        })
    }
}

export const getSalesData = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const totalProducts = await Product.countDocuments({});
        const totalOrders = await Order.countDocuments({ status: "Paid" });

        const totalSaleAgg = await Order.aggregate([
            { $match: { status: "Paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalSales = totalSaleAgg[0]?.total || 0;

        const topProducts = await Order.aggregate([
            { $match: { status: "Paid" } },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: "$products.productId",
                    name: { $first: "$productInfo.productName" },
                    quantity: { $sum: "$products.quantity" }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 7 },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    quantity: 1
                }
            }
        ]);

        res.json({
            success: true,
            totalUsers,
            totalProducts,
            totalOrders,
            totalSales,
            topProducts
        });

    } catch (error) {
        console.log("Error Fetching Sales Data:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sales data",
            error: error.message
        });
    }
};





// export const getSalesData = async (req, res) => {
//     try {
//         const totalUsers = await User.countDocuments({});
//         const totalProducts = await Product.countDocuments({});
//         const totalOrders = await Order.countDocuments({ status: "Paid" });

//         // total sales amount
//         const totalSaleAgg = await Order.aggregate([
//             { $match: { status: "Paid" } },
//             { $group: { _id: null, total: { $sum: "$amount" } } }
//         ])

//         const totalSales = totalSaleAgg[0]?.total || 0;

//         // sales grouped by day for last 30 days

//         const thirtyDaysAgo = new Date();
//         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//         const salesByDay = await Order.aggregate([
//             { $match: { status: "Paid", createdAt: { $gte: thirtyDaysAgo } } },
//             {
//                 $group: {
//                     _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//                     amount: { $sum: "$amount" },
//                 }
//             },
//             { $sort: { _id: 1 } }
//         ])

//         console.log("Sales By Day:", salesByDay)

//         const fromattedSales = salesByDay.map(item => ({
//             date: item._id,
//             amount: item.amount
//         }))

//         console.log("Formatted Sales:", fromattedSales)

//         // res.json({
//         //     success: true,
//         //     totalUsers,
//         //     totalProducts,
//         //     totalOrders,
//         //     totalSales, 
//         //     // sales: fromattedSales
//         //     salesByDate: res.data.sales  
//         // })

//         res.json({
//             success: true,
//             totalUsers,
//             totalProducts,
//             totalOrders,
//             totalSales,
//             salesByDate: fromattedSales   // ✅ FIX
//         })

//     } catch (error) {
//         console.log("Error Fetching Sales Data:", error)
//         console.log(error.stack)

//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch sales data",
//             error: error.message
//         })
//     }
// }


// export const getMyOrders = async (req, res) => {
//     try {
//         const userId = req.id;
//         const orders = await Order.find({ user: userId })
//         .populate({path:"products.product", select:"productName productPrice productImg"})
//         .populate("user", "firstName lastName email")

//         res.status(200).json({
//             success: true,
//             count: orders.length,
//             orders
//         })
//     } catch (error) {
//         console.error("Error Fetching User Orders:", error)
//         res.status(500).json({
//             message: error.message
//         })
//     }
// }
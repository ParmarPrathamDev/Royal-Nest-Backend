import { Cart } from "../models/cartModel.js";
import { Product } from "../models/productModel.js";

// GET CART
export const getCart = async (req, res) => {
    try {
        const userId = req.id;

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart) {
            return res.json({ success: true, cart: [] });
        }

        res.status(200).json({ success: true, cart });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ADD TO CART
export const addToCart = async (req, res) => {
    try {
        const userId = req.id;
        const { productId, quantity = 1 } = req.body;

        const reqQuantity = Number(quantity) || 1;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        // ✅ Out of stock check
        if (product.quantity === 0) {
            return res.status(400).json({
                success: false,
                message: "Out of Stock"
            });
        }

        // ✅ Invalid quantity check
        if (reqQuantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid quantity"
            });
        }

        // ✅ Max allowed = stock or 5
        const maxAllowed = Math.min(5, product.quantity);

        // ✅ If single add quantity itself exceeds
        if (reqQuantity > maxAllowed) {
            return res.status(400).json({
                success: false,
                message:
                    product.quantity < 5
                        ? `Only ${product.quantity} items available`
                        : "You cannot buy more than 5 items"
            });
        }

        // Find the user's cart
        let cart = await Cart.findOne({ userId });

        // If cart doesn't exist, create new one
        if (!cart) {
            cart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity: reqQuantity,
                    price: Number(product.productPrice)
                }],
                totalPrice: Number(product.productPrice) * reqQuantity
            });
        } else {
            // Check if product already exists in cart
            const itemIndex = cart.items.findIndex(
                (item) => item.productId.toString() === productId
            );

            if (itemIndex > -1) {
                const newQty = cart.items[itemIndex].quantity + reqQuantity;

                // ✅ Existing cart qty + new qty check
                if (newQty > maxAllowed) {
                    return res.status(400).json({
                        success: false,
                        message:
                            product.quantity < 5
                                ? `Only ${product.quantity} items available`
                                : "You cannot buy more than 5 items"
                    });
                }

                cart.items[itemIndex].quantity = newQty;
            } else {
                cart.items.push({
                    productId,
                    quantity: reqQuantity,
                    price: Number(product.productPrice)
                });
            }

            // Recalculate total price
            cart.totalPrice = cart.items.reduce(
                (acc, item) => acc + Number(item.price) * item.quantity,
                0
            );
        }

        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate("items.productId");

        res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            cart: populatedCart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE QUANTITY
export const updatequantity = async (req, res) => {
    try {
        const userId = req.id;
        const { productId, type } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart Not Found"
            });
        }

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        const maxAllowed = Math.min(5, product.quantity);

        if (type === "increase") {
            if (product.quantity === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Out of Stock"
                });
            }

            if (item.quantity + 1 > maxAllowed) {
                return res.status(400).json({
                    success: false,
                    message:
                        product.quantity < 5
                            ? `Only ${product.quantity} items available`
                            : "You cannot buy more than 5 items"
                });
            }

            item.quantity += 1;
        }

        if (type === "decrease" && item.quantity > 1) {
            item.quantity -= 1;
        }

        cart.totalPrice = cart.items.reduce(
            (acc, item) => acc + Number(item.price) * item.quantity,
            0
        );

        await cart.save();
        cart = await cart.populate("items.productId");

        res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// REMOVE FROM CART
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.id;
        const { productId } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        cart.totalPrice = cart.items.reduce(
            (acc, item) => acc + Number(item.price) * item.quantity,
            0
        );

        await cart.save();
        cart = await cart.populate("items.productId");

        res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};







/// quantity mate problam aavti hati aatle change kariyu chhe 



// import { Cart } from "../models/cartModel.js";
// import { Product } from "../models/productModel.js";

// // GET CART
// export const getCart = async (req, res) => {
//     try {
//         const userId = req.id;

//         const cart = await Cart.findOne({ userId }).populate("items.productId");
//         if (!cart) {
//             return res.json({ success: true, cart: [] });
//         }

//         res.status(200).json({ success: true, cart });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // ADD TO CART
// export const addToCart = async (req, res) => {
//     try {
//         const userId = req.id;
//         // const { productId } = req.body;
//         const { productId, quantity } = req.body;

//         // Check if product exists
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product Not Found"
//             });
//         }

//         // Find the user's cart (if exists)
//         let cart = await Cart.findOne({ userId });

//         // If cart doesn't exist, create a new one
//         if (!cart) {
//             cart = new Cart({
//                 userId,
//                 // items: [{ productId, quantity: 1, price: Number(product.productPrice) }],
//                 // totalPrice: Number(product.productPrice)
//                 items: [{ productId, quantity, price: Number(product.productPrice) }],
//                 totalPrice: Number(product.productPrice) * quantity
//             });
//         } else {
//             // Check if product is already in the cart
//             const itemIndex = cart.items.findIndex(
//                 (item) => item.productId.toString() === productId
//             );

//             if (itemIndex > -1) {
//                 // If exists, increase quantity
//                 // cart.items[itemIndex].quantity += 1;
//                 cart.items[itemIndex].quantity += quantity;
//             } else {
//                 // If new product, push to cart
//                 cart.items.push({
//                     productId,
//                     // quantity: 1,
//                     quantity,
//                     price: Number(product.productPrice)
//                 });
//             }

//             // Recalculate total price
//             cart.totalPrice = cart.items.reduce(
//                 (acc, item) => acc + Number(item.price) * item.quantity,
//                 0
//             );
//         }

//         // Save updated cart
//         await cart.save();

//         // Populate product details before sending response
//         const populatedCart = await Cart.findById(cart._id).populate("items.productId");

//         res.status(200).json({
//             success: true,
//             message: "Product added to cart successfully",
//             cart: populatedCart
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // UPDATE QUANTITY
// export const updatequantity = async (req, res) => {
//     try {
//         const userId = req.id;
//         const { productId, type } = req.body;

//         let cart = await Cart.findOne({ userId });
//         if (!cart) return res.status(404).json({ success: false, message: "Cart Not Found" });

//         const item = cart.items.find(item => item.productId.toString() === productId);
//         if (!item) return res.status(404).json({ success: false, message: "Item not found" });

//         if (type === "increase") item.quantity += 1;
//         if (type === "decrease" && item.quantity > 1) item.quantity -= 1;

//         cart.totalPrice = cart.items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

//         await cart.save();
//         cart = await cart.populate("items.productId");

//         res.status(200).json({ success: true, cart });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

// // REMOVE FROM CART
// export const removeFromCart = async (req, res) => {
//     try {
//         const userId = req.id;
//         const { productId } = req.body;

//         let cart = await Cart.findOne({ userId });
//         if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

//         cart.items = cart.items.filter(item => item.productId.toString() !== productId);
//         cart.totalPrice = cart.items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

//         cart = await cart.populate("items.productId")

//         await cart.save();

//         res.status(200).json({ success: true, cart });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };



// import { Cart } from "../models/cartModel.js";
// import { Product } from "../models/productModel.js"

// export const getCart = async (req, res) => {
//     try {
//         const userId = req.id;

//         const cart = await Cart.findOne({ userId }).populate("items.productId");
//         if (!cart) {
//             return res.json({ success: true, cart: [] })
//         }
//         res.status(200).json({ success: true, cart })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             Message: error.Message
//         })
//     }
// }

// export const addToCart = async (req, res) => {
//     try {
//         const userId = req.id;
//         const { productId } = req.body;

//         // check if product exists
//         const product = await Product.findById(productId)
//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 Message: "Product Not Found"
//             })
//         }
//         // // find the user's cart (if Exists)
//         let cart = await Cart.findById({ userId })


//         // if cart dosent exist  create a new one

//         if (!cart) {
//             cart = new Cart({
//                 userId,
//                 items: [{ productId, quantity: 1, price: product.productPrice }],
//                 totalPrice: product.productPrice
//             })
//         } else {
//             // find if product is alrady in the cart
//             const itemIndex = cart.items.findIndex(
//                 (item) => item.productId.toString() === productId
//             )
//             if (itemIndex > -1) {
//                 // if product exists -> just increase quantity
//                 cart.items[itemIndex].quantity += 1
//             } else {
//                 // if new product -> push to cart
//                 cart.items.push({
//                     productId,
//                     quantity: 1,
//                     price: product.productPrice,
//                 })
//             }
//             // recalculate total price

//             cart.totalPrice = cart.items.reduce(
//                 (acc, item) => acc + item.price * item.quantity
//             )
//         }
//         // save updated cart
//         await cart.save()

//         // Populate product detail  before sending response
//         const populatedCart = await Cart.findById(cart._id).populate("items.productId")

//         res.status(200).json({
//             success: true,
//             message: "Product added to cart successfully",
//             cart: populatedCart
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// export const updatequantity = async (req, res) => {
//     try {
//         const userId = req.id;
//         const { productId, type } = req.body;

//         let cart = await Cart.findOne({ userId })
//         if (!cart) return res.status(404).json({
//             success: false,
//             message: "Cart Not Found"
//         })

//         const item = cart.items.find(item => item.productId.toString() === productId) // check karse she ke product iteam ma chhe ke nai
//         if (!item) return res.status(404).json({
//             success: false,
//             message: "Items not found"
//         })

//         if (type === "increase") item.quantity += 1
//         if (type === "decrease" && item.quantity > 1) item.quantity -= 1;

//         cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

//         await cart.save()
//         cart = await cart.populate("items.productId")

//         res.status(200).json({ success: true, cart })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }


// export const removeFromCart = async (req, res) => {
//     try {

//         const userId = req.id;
//         const { productId } = req.body;

//         let cart = await Cart.findOne({ userId });
//         if (!cart) return res.status(404).json({
//             success: false,
//             message: "Cart not found"
//         })

//         cart.items = cart.items.filter(item => item.productId.toString() !== productId)
//         cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

//         await cart.save()
//         res.status(200).json({
//             success: true,
//             cart
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             Message: error.Message
//         })
//     }
// }
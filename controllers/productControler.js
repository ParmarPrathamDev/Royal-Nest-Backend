import { Product } from "../models/productModel.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";
import { Category } from "../models/categoryModel.js";

// ADD PRODUCT
export const addProduct = async (req, res) => {
    try {

        console.log("BODY:", req.body);
        console.log("FILES:", req.files);
        console.log("USER ID:", req.id);

        const { productName, productDesc, productPrice, category, brand, quantity } = req.body;
        // ✅ VALIDATION
        if (productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot be negative"
            });
        }
        const userId = req.id;

        if (!productName || !productDesc || !productPrice || !category || !brand || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // ✅ quantity negative check
        if (Number(quantity) < 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot be negative"
            })
        }

        let productImg = [];

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {

                const fileUri = getDataUri(file);

                const result = await cloudinary.uploader.upload(fileUri, {
                    folder: "mern_products"
                });

                productImg.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        }

        const newProduct = await Product.create({
            userId,
            productName,
            productDesc,
            productPrice,
            category,
            brand,
            quantity: Number(quantity), // ✅ IMPORTANT FIX
            productImg
        })

        return res.status(200).json({
            success: true,
            message: "Product added successfully",
            product: newProduct
        })

    } catch (error) {

        console.log("🔥 BACKEND ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// GET ALL PRODUCTS 
export const getAllProduct = async (_, res) => {
    try {

        const products = await Product.find().populate("category", "categoryName");

        if (!products) {
            return res.status(404).json({
                success: false,
                message: "No product available",
                products: []
            })
        }

        return res.status(200).json({
            success: true,
            products
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// DELETE PRODUCT 
export const deleteProduct = async (req, res) => {
    try {

        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            })
        }

        if (product.productImg && product.productImg.length > 0) {
            for (let img of product.productImg) {
                await cloudinary.uploader.destroy(img.public_id);
            }
        }

        await Product.findByIdAndDelete(productId);

        return res.status(200).json({
            success: true,
            message: "Product Deleted Successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// UPDATE PRODUCT 
export const updateProduct = async (req, res) => {
    try {

        const { productId } = req.params;
        const { productName, productDesc, productPrice, category, brand, existingImages, quantity } = req.body;
        // ✅ VALIDATION
        if (productPrice !== undefined && productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        if (quantity !== undefined && quantity < 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot be negative"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        // ✅ quantity negative check
        if (quantity !== undefined && Number(quantity) < 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot be negative"
            })
        }

        let updatedImages = product.productImg || [];

        if (existingImages) {

            const keepIds = JSON.parse(existingImages);

            updatedImages = product.productImg.filter((img) =>
                keepIds.includes(img.public_id)
            );

            const removedImages = product.productImg.filter(
                (img) => !keepIds.includes(img.public_id)
            );

            for (let img of removedImages) {
                await cloudinary.uploader.destroy(img.public_id);
            }

        } else {
            updatedImages = product.productImg;
        }

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {

                const fileUri = getDataUri(file);

                const result = await cloudinary.uploader.upload(fileUri.content, {
                    folder: "mern_products"
                });

                updatedImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        }

        product.productName = productName || product.productName;
        product.productDesc = productDesc || product.productDesc;
        product.productPrice = productPrice || product.productPrice;
        product.category = category || product.category;
        product.brand = brand || product.brand;

        product.quantity = quantity !== undefined ? Number(quantity) : product.quantity; // ✅ FIX

        product.productImg = updatedImages;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// SEARCH PRODUCT
export const searchProduct = async (req, res) => {
    try {

        const { keyword, category, brand, minPrice, maxPrice } = req.query;

        console.log("👉 QUERY PARAMS:", req.query);

        let query = {};

        if (keyword) {
            query.productName = { $regex: keyword, $options: "i" };
        }

        if (category && category !== "All") {

            const cat = await Category.findOne({
                categoryName: { $regex: `^${category}$`, $options: "i" }
            });

            if (!cat) {
                return res.status(200).json({
                    success: true,
                    products: []
                });
            }

            query.category = cat._id;
        }

        if (brand && brand !== "All") {
            query.brand = brand;
        }

        if (minPrice || maxPrice) {
            query.productPrice = {
                $gte: Number(minPrice) || 0,
                $lte: Number(maxPrice) || 999999
            };
        }

        const products = await Product.find(query)
            .populate("category", "categoryName");

        res.status(200).json({
            success: true,
            products
        });

    } catch (error) {

        console.log("🔥 FULL ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};




// quantity mate aa kariyu chhe















// import { Product } from "../models/productModel.js";
// import getDataUri from "../utils/dataUri.js";
// import cloudinary from "../utils/cloudinary.js";
// import { Category } from "../models/categoryModel.js";

// export const addProduct = async (req, res) => {
//     try {

//         console.log("BODY:", req.body);
//         console.log("FILES:", req.files);
//         console.log("USER ID:", req.id);

//         // const { productName, productDesc, productPrice, category, brand } = req.body;
//         const { productName, productDesc, productPrice, category, brand, quantity } = req.body;
//         const userId = req.id;

//         // if (!productName || !productDesc || !productPrice || !category || !brand) {
//         if (!productName || !productDesc || !productPrice || !category || !brand || quantity === undefined) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             })
//         }

//         let productImg = [];

//         // if (req.files && req.files.length > 0) {
//         //     for (let file of req.files) {

//         //         const fileUri = getDataUri(file);

//         //         const result = await cloudinary.uploader.upload(fileUri.content, {
//         //             folder: "mern_products"
//         //         });

//         //         productImg.push({
//         //             url: result.secure_url,
//         //             public_id: result.public_id
//         //         })
//         //     }
//         // }
//         if (req.files && req.files.length > 0) {
//             for (let file of req.files) {

//                 const fileUri = getDataUri(file);

//                 const result = await cloudinary.uploader.upload(fileUri, {
//                     folder: "mern_products"
//                 });

//                 productImg.push({
//                     url: result.secure_url,
//                     public_id: result.public_id
//                 });
//             }
//         }

//         const newProduct = await Product.create({
//             userId,
//             productName,
//             productDesc,
//             productPrice,
//             category,
//             brand,
//             quantity,
//             productImg
//         })

//         return res.status(200).json({
//             success: true,
//             message: "Product added successfully",
//             product: newProduct
//         })

//     } catch (error) {

//         console.log("🔥 BACKEND ERROR:", error); // ✅ error log here

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// //  GET ALL PRODUCTS
// export const getAllProduct = async (_, res) => {
//     try {

//         // ✅ CHANGE: populate("category") add કર્યું
//         // જેથી product સાથે categoryName પણ મળે
//         const products = await Product.find().populate("category", "categoryName");

//         if (!products) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No product available",
//                 products: []
//             })
//         }

//         return res.status(200).json({
//             success: true,
//             products
//         })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// //  DELETE PRODUCT
// export const deleteProduct = async (req, res) => {
//     try {

//         const { productId } = req.params;

//         const product = await Product.findById(productId);

//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product Not Found"
//             })
//         }

//         // delete images from cloudinary
//         if (product.productImg && product.productImg.length > 0) {
//             for (let img of product.productImg) {
//                 await cloudinary.uploader.destroy(img.public_id);
//             }
//         }

//         await Product.findByIdAndDelete(productId);

//         return res.status(200).json({
//             success: true,
//             message: "Product Deleted Successfully"
//         })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// // UPDATE PRODUCT
// export const updateProduct = async (req, res) => {
//     try {

//         const { productId } = req.params;
//         // const { productName, productDesc, productPrice, category, brand, existingImages } = req.body;
//         const { productName, productDesc, productPrice, category, brand, existingImages, quantity } = req.body;

//         const product = await Product.findById(productId);

//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product Not Found"
//             });
//         }

//         let updatedImages = product.productImg || [];

//         // keep selected old images
//         if (existingImages) {

//             const keepIds = JSON.parse(existingImages);

//             updatedImages = product.productImg.filter((img) =>
//                 keepIds.includes(img.public_id)
//             );

//             const removedImages = product.productImg.filter(
//                 (img) => !keepIds.includes(img.public_id)
//             );

//             for (let img of removedImages) {
//                 await cloudinary.uploader.destroy(img.public_id);
//             }

//         } else {
//             updatedImages = product.productImg;
//         }

//         // upload new images
//         if (req.files && req.files.length > 0) {
//             for (let file of req.files) {

//                 const fileUri = getDataUri(file);

//                 const result = await cloudinary.uploader.upload(fileUri.content, {
//                     folder: "mern_products"
//                 });

//                 updatedImages.push({
//                     url: result.secure_url,
//                     public_id: result.public_id
//                 });
//             }
//         }

//         // update product data
//         product.productName = productName || product.productName;
//         product.productDesc = productDesc || product.productDesc;
//         product.productPrice = productPrice || product.productPrice;

//         product.category = category || product.category;
//         // ✅ અહીં category હવે ObjectId store થશે

//         product.brand = brand || product.brand;
//         product.quantity = quantity ?? product.quantity; // quantity માટે nullish coalescing operator
//         product.productImg = updatedImages;

//         await product.save();

//         return res.status(200).json({
//             success: true,
//             message: "Product updated successfully"
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // SEARCH PRODUCT

// export const searchProduct = async (req, res) => {
//     try {

//         const { keyword, category, brand, minPrice, maxPrice } = req.query;

//         console.log("👉 QUERY PARAMS:", req.query);

//         let query = {};

//         // 🔍 Keyword Search
//         if (keyword) {
//             query.productName = { $regex: keyword, $options: "i" };
//         }

//         // 🗂 Category Fix (MAIN ISSUE FIXED)
//         if (category && category !== "All") {

//             console.log("👉 Category from frontend:", category);

//             const cat = await Category.findOne({
//                 categoryName: { $regex: `^${category}$`, $options: "i" }
//             });

//             console.log("👉 Category from DB:", cat);

//             if (!cat) {
//                 console.log("❌ Category NOT FOUND");

//                 return res.status(200).json({
//                     success: true,
//                     products: []
//                 });
//             }

//             query.category = cat._id;
//         }

//         // 🏷 Brand
//         if (brand && brand !== "All") {
//             query.brand = brand;
//         }

//         // 💰 Price
//         if (minPrice || maxPrice) {
//             query.productPrice = {
//                 $gte: Number(minPrice) || 0,
//                 $lte: Number(maxPrice) || 999999
//             };
//         }

//         console.log("👉 FINAL QUERY:", query);

//         const products = await Product.find(query)
//             .populate("category", "categoryName");

//         res.status(200).json({
//             success: true,
//             products
//         });

//     } catch (error) {

//         console.log("🔥 FULL ERROR:", error);
//         console.log("🔥 MESSAGE:", error.message);

//         res.status(500).json({
//             success: false,
//             message: error.message
//         });

//     }
// };





// ADD PRODUCT
// export const addProduct = async (req, res) => {
//     try {
//         console.log("BODY:", req.body);
//         console.log("FILES:", req.files);
//         console.log("USER ID:", req.id);
//         const { productName, productDesc, productPrice, category, brand } = req.body;
//         const userId = req.id;

//         if (!productName || !productDesc || !productPrice || !category || !brand) {
//             return res.status(400).json({
//                 console.log("🔥 BACKEND ERROR:", error);
//                 success: false,
//                 message: "All fields are required"
//             })
//         }

//         let productImg = [];

//         if (req.files && req.files.length > 0) {
//             for (let file of req.files) {

//                 const fileUri = getDataUri(file);

//                 const result = await cloudinary.uploader.upload(fileUri.content, {
//                     folder: "mern_products"
//                 });

//                 productImg.push({
//                     url: result.secure_url,
//                     public_id: result.public_id
//                 })
//             }
//         }

//         const newProduct = await Product.create({
//             userId,
//             productName,
//             productDesc,
//             productPrice,
//             category, // ✅ અહીં હવે category ObjectId store થશે
//             brand,
//             productImg
//         })

//         return res.status(200).json({
//             success: true,
//             message: "Product added successfully",
//             product: newProduct
//         })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }




// export const searchProduct = async (req, res) => {
//     try {

//         const { keyword, category, brand, minPrice, maxPrice } = req.query

//         let query = {}

//         if (keyword) {
//             query.productName = { $regex: keyword, $options: "i" }
//         }

//         if (category && category !== "All") {
//             query.category = category
//         }

//         if (brand && brand !== "All") {
//             query.brand = brand
//         }

//         if (minPrice || maxPrice) {
//             query.productPrice = {
//                 $gte: minPrice || 0,
//                 $lte: maxPrice || 999999
//             }
//         }

//         const products = await Product.find(query).populate("category", "categoryName")

//         res.status(200).json({
//             success: true,
//             products
//         })

//     } catch (error) {

//         res.status(500).json({
//             success: false,
//             message: error.message
//         })

//     }
// }








// import { Product } from "../models/productModel.js";
// import getDataUri from "../utils/dataUri.js";
// import cloudinary from "../utils/cloudinary.js"; // ✅ ADD THIS

// export const addProduct = async (req, res) => {
//     try {

//         const { productName, productDesc, productPrice, category, brand } = req.body;
//         const userId = req.id;

//         if (!productName || !productDesc || !productPrice || !category || !brand) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             })
//         }

//         // Handle multiple image uploads

//         let productImg = [];

//         if (req.files && req.files.length > 0) {
//             for (let file of req.files) {
//                 const fileUri = getDataUri(file)
//                 const result = await cloudinary.uploader.upload(fileUri, {
//                     folder: "mern_products" // cloudinary folder name
//                 });
//                 productImg.push({
//                     url: result.secure_url,
//                     public_id: result.public_id
//                 })
//             }
//         }
//         // create a product in DB

//         const newProduct = await Product.create({
//             userId,
//             productName,
//             productDesc,
//             productPrice,
//             category,
//             brand,
//             productImg, // array of object [{url, public_id}.{url, public_id}]
//         })

//         return res.status(200).json({
//             success: true,
//             message: "Product added successfully",
//             product: newProduct
//         })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// export const getAllProduct = async (_, res) => {
//     try {

//         const products = await Product.find()
//         if (!products) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No product avalable",
//                 products: []
//             })
//         }

//         return res.status(200).json({
//             success: true,
//             products
//         })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// export const deleteProduct = async (req, res) => {
//     try {
//         const { productId } = req.params;

//         const product = await Product.findById(productId)
//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product Not Found"
//             })
//         }

//         // delete images from cloudanary
//         if (product.productImg && product.productImg.length > 0) {
//             for (let img of product.productImg) {
//                 const result = await cloudinary.uploader.destroy(img.public_id);
//             }
//         }

//         // delete product from mongo DB

//         await Product.findByIdAndDelete(productId);
//         return res.status(200).json({
//             success: true,
//             message: "Product Deleted Successfully"
//         })


//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// export const updateProduct = async (req, res) => {
//     try {
//         const { productId } = req.params;
//         const { productName, productDesc, productPrice, category, brand, existingImages } = req.body;

//         const product = await Product.findById(productId);

//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product Not Found"
//             });
//         }

//         let updatedImages = product.productImg || [];

//         // Keep selected old images
//         if (existingImages) {
//             const keepIds = JSON.parse(existingImages);
//             updatedImages = product.productImg.filter((img) =>
//                 keepIds.includes(img.public_id)
//             );

//             // delete only removed images
//             const removedImages = product.productImg.filter(
//                 (img) => !keepIds.includes(img.public_id)
//             );

//             for (let img of removedImages) {
//                 await cloudinary.uploader.destroy(img.public_id);
//             }
//         } else {
//             updatedImages = product.productImg; // leep all if nothing sent

//         }

//         // Upload new images if any

//         if (req.files && req.files.length > 0) {
//             for (let file of req.files) {
//                 const fileUri = getDataUri(file);

//                 const result = await cloudinary.uploader.upload(fileUri.content, {
//                     folder: "mern_products"
//                 });

//                 updatedImages.push({
//                     url: result.secure_url,
//                     public_id: result.public_id
//                 });
//             }
//         }

//         // Update product

//         product.productName = productName || product.productName;
//         product.productDesc = productDesc || product.productDesc;
//         product.productPrice = productPrice || product.productPrice;
//         product.category = category || product.category;
//         product.brand = brand || product.brand;
//         product.productImg = updatedImages;

//         await product.save();

//         return res.status(200).json({
//             success: true,
//             message: "Product updated successfully"
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };












// export const updateProduct = async (req, res) => {
//     try {
//         const { productId } = req.params;
//         const { productName, productDesc, productPrice, category, brand, existingImages } = req.body;

//         const product = await Product.findById(productId)
//         if (!product) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product Not Found"
//             })
//         }

//         product.productImg = updatedImages;

//         // keep selected old images
//         if (existingImages) {
//             const keepIds = JSON.parse(existingImages); // variable banayo
//             updatedImages = product.productImg.filter((img) =>
//                 keepIds.includes(img.public_id)
//             );
//             // delete only removed images

//             const removedImages = product.productImg.filter(
//                 (img) => !keepIds.includes(img.public_id)
//             );

//             for (let img of removedImages) {
//                 await cloudinary.uploader.destroy(img.public_id)
//             }
//         } else {
//             updatedImages = product.productImg //   jo image update kariya nathi to pehla na image j rakhse
//         }

//         // upload new images  if any
//         if (req.files && req.files.length > 0) {
//             for (let file of req.files) {
//                 const fileuri = getDataUri(file)
//                 const result = await cloudinary.uploader.upload(fileUri, { folder: "mern_products" })
//                 updatedImages.push({
//                     url: result.secure_url,
//                     public_id: result.public_id
//                 })
//             }
//         }

//         // update product
//         product.productName = productName || product.productName;
//         product.productDesc = productDesc || product.productDesc;
//         product.productPrice = productPrice || product.productPrice;
//         product.category = category || product.category;
//         product.brand = brand || product.brand;
//         product.productImg = updatedImages;


//         await product.save()

//         return res.status(200).json({
//             success: true,
//             message: "product update successfully"
//         })

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }   
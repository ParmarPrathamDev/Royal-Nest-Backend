// import { SubCategory } from "../models/subCategoryModel.js";

// export const addSubCategory = async (req, res) => {
//   try {
//     const { name, categoryId } = req.body;

//     const subCategory = await SubCategory.create({
//       name,
//       category: categoryId
//     });

//     res.status(201).json({
//       success: true,
//       subCategory
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// export const getSubCategory = async (req, res) => {
//   try {

//     const subCategories = await SubCategory.find()
//       .populate("category", "categoryName");

//     res.status(200).json({
//       success: true,
//       subCategories
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
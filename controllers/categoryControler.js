import { Category } from "../models/categoryModel.js";
import cloudinary from "cloudinary";

export const addCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Category name required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Category image required"
      });
    }

    // 👉 buffer ne base64 ma convert kar
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // 👉 cloudinary upload
    const uploaded = await cloudinary.v2.uploader.upload(fileStr, {
      folder: "categories"
    });

    const category = await Category.create({
      categoryName,
      categoryImg: {
        url: uploaded.secure_url,
        public_id: uploaded.public_id
      }
    });

    res.status(201).json({
      success: true,
      category
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// export const addCategory = async (req, res) => {
//   try {

//     const { categoryName } = req.body;

//     if (!categoryName) {
//       return res.status(400).json({
//         success: false,
//         message: "Category name required"
//       });
//     }

//     const category = await Category.create({
//       categoryName
//     });

//     res.status(201).json({
//       success: true,
//       category
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


export const getAllCategory = async (req, res) => {
  try {

    const categories = await Category.find();

    res.status(200).json({
      success: true,
      categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // 👉 Cloudinary mathi image delete
    if (category.categoryImg?.public_id) {
      await cloudinary.v2.uploader.destroy(category.categoryImg.public_id);
    }

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { categoryName } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    let updatedData = {
      categoryName: categoryName || category.categoryName
    };

    // 👉 jo new image aave to
    if (req.file) {
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const uploaded = await cloudinary.v2.uploader.upload(fileStr, {
        folder: "categories"
      });

      updatedData.categoryImg = [
        {
          url: uploaded.secure_url,
          public_id: uploaded.public_id
        }
      ];
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      updatedCategory
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// export const deleteCategory = async (req, res) => {
//   try {

//     const { categoryId } = req.params;

//     const category = await Category.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found"
//       });
//     }

//     await Category.findByIdAndDelete(categoryId);

//     return res.status(200).json({
//       success: true,
//       message: "Category deleted successfully"
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
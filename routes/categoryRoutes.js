import express from "express";
import { addCategory, deleteCategory, getAllCategory, updateCategory } from "../controllers/categoryControler.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

router.post("/add", singleUpload, addCategory);
router.get("/get", getAllCategory);
router.delete("/delete/:categoryId", deleteCategory);
router.put("/update/:categoryId", singleUpload, updateCategory);

export default router;
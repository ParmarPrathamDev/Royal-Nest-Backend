import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },

    categoryImg: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      }
    ]
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
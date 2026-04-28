import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    productName: { type: String, required: true },
    productDesc: { type: String, required: true },

    productImg: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      }
    ],

    productPrice: { type: Number },

    quantity: { 
      type: Number, 
      required: true, 
      default: 0 
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },

    brand: { type: String },
  },
  { timestamps: true }
)

export const Product = mongoose.model("Product", productSchema)










// quantity mate 

// import mongoose from "mongoose"

// const productSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     },

//     productName: { type: String, required: true },
//     productDesc: { type: String, required: true },

//     productImg: [
//       {
//         url: { type: String, required: true },
//         public_id: { type: String, required: true },
//       }
//     ],

//     productPrice: { type: Number },

//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category"
//     },

//     brand: { type: String },
//   },
//   { timestamps: true }
// )

// export const Product = mongoose.model("Product", productSchema)

// // import monoose, { Types } from "mongoose"
// import mongoose from "mongoose"

// const productSchema = new monoose.Schema(
//     {
//         userId: {
//             type: monoose.Schema.Types.ObjectId,
//             ref: "User"
//         },
//         productName: { type: String, required: true },
//         productDesc: { type: String, required: true },

//         productImg: [
//             {
//                 url: { type: String, required: true },
//                 public_id: { type: String, required: true },

//             }
//         ],

//         productPrice: { type: Number },
//         // category: { type: String },
//         category: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Category"
//         },
//         brand: { type: String },
//     },
//     { timestamps: true } // created at and updated at
// )


// export const Product = monoose.model("Product", productSchema)
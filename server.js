import express from 'express'
import 'dotenv/config'
import { connect } from 'mongoose'
import connectDB from './database/db.js'
import userRoute from './routes/userRoute.js'
import cors from 'cors'
import productRoute from './routes/productRoute.js'
import cartRoute from './routes/cartRoute.js'
import orderRoute from './routes/orderRoutes.js'
import categoryRoutes from "./routes/categoryRoutes.js";
// import subCategoryRoutes from "./routes/subCategoryRoutes.js";

const app = express()
const PORT = process.env.PORT || 3000

// middleware
app.use(express.json())
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://royal-nest-frontend.vercel.app/"
    ],
    credentials: true
}))
app.use('/api/v1/user', userRoute);
app.use('/api/v1/product', productRoute);
app.use("/api/v1/category", categoryRoutes);
app.use('/api/v1/cart', cartRoute);
app.use('/api/v1/orders', orderRoute);
app.use("/uploads", express.static("uploads"));


// app.use("/api/v1/subcategory", subCategoryRoutes);

// http://localhost:8000/api/v1/user/register

app.listen(PORT, () => {
    connectDB()
    console.log(`server is listening at port: ${PORT}`);


})
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connection Successfully');
    } catch (error) {
        console.log("MongoDB connection faild:", error);
    }
}

export default connectDB;
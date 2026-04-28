import DataUriParser from "datauri/parser.js";
import path from "path";

const parser = new DataUriParser();

const getDataUri = (file) => {
    const extName = path.extname(file.originalname).toString(); // je bhi file multer thi file upload karu aa string thi jase
    return parser.format(extName, file.buffer).content;// photo me 64 convert thay  image Cloudinary ma upload thai jay  
};

export default getDataUri;
 
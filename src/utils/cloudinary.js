import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath)=>{
    try {
        if(!localfilePath) return null;
    
        const respone = await cloudinary.uploader.upload(localfilePath,{
            resource_type:"auto"
        })
        console.log("file uploaded on cloudinay",respone.url);
        return respone
    } catch (error) {
        fs.unlinkSync(localfilePath); // remove the localy saved file when the file upload to cloudinay is failed
        return null;
        
    }

}
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
};

export {uploadOnCloudinary,deleteFromCloudinary}
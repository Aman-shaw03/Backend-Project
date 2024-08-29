import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

// upload the file with a method , if successfull unlink the file from fs using try-catch
 const uploadOnCloudinary = async (filePath) => {
    try {
        // uploading the file
        if(!filePath) return ("Filepath not found ")
        const response = await cloudinary.uploader.upload(filePath,{
            resource_type: "auto"
        })
        //file uploaded
  
        // since file uploaded , unlink file from fs
        fs.unlinkSync(filePath)
        return response;
    } catch (error) {
        // remove the file from fs , even if file upload failed for security purposes
        fs.unlinkSync(filePath)
        return null;
    }
 }

 export {uploadOnCloudinary}
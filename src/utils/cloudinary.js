import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { asyncHandler } from "./asyncHandler";
import { format } from "express/lib/response";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

// upload the file with a method , if successfull unlink the file from fs using try-catch

const uploadPhotoOnCloudinary = async (filePath) => {
    if(!filePath){
        return null
    }
    console.log("Image is Loading");

    try {
        const cloudinary_res = await cloudinary.uploader.upload(
            filePath,
            {
                resource_type: "auto",
                folder: "videoTube/photos"
            }
        )
    
        //since file is uploaded unlink from local storage
        fs.unlinkSync(filePath)
        return cloudinary_res
    } catch (error) {
        fs.unlinkSync(filePath)
        console.log("ERROR :: While uploading Image on Cloudinary ::" ,error);
        return null
    }
    
}
const uploadVideoOnCloudinary = async (filePath) => {
    if(!filePath) return null

    console.log("Video File is Uploading !!!");

    try {
        const cloudinary_res = await cloudinary.uploader.upload(
            filePath,
            {
                resource_type: "video",
                folder: "videoTube/videos",
                eager: [
                    {
                        streaming_profile: "hd", // streaming profile could be full-hd, hd, sd based on the plan
                        format: "m3u8" //format for HTTP live streaming version, with eager we are creating differen version of our asset, to show differently based on coditions
    
                    }
                ]
            }
        )
    
        fs.unlinkSync(filePath)
        const h1url = cloudinary_res.eager?.[0]?.secure_url
        return {...cloudinary_res, h1url}
    } catch (error) {
        fs.unlinkSync(filePath)
        console.log("ERROR :: WHILE UPLOADING VIDEO ON CLOUDINARY :: ", error);
        return null
        
    }
}
const deletePhotoOnCloudinary = async (URL) => {
    if(!URL) return null
    const imageId = URL.match(
        /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
    )[2];
      /*This is the regular expression itself, which matches a Cloudinary URL and captures two groups:
        The first group ((photos|videos)) captures either "photos" or "videos".
        The second group ((.+?)\.\w+$) captures the image ID.
        [2]: This accesses the second captured group from the match array. Since the image ID is captured in the second group,
     */
    console.log("Deleting Photo from Cloudinary!!! ");
    try {
        const cloudinary_res = await cloudinary.uploader.destroy(
            `videoTube/photos/${imageId}`,
            {
                resource_type: 'image'
            }
        )
        return cloudinary_res
    } catch (error){
        console.log("ERROR:: WHILE DELETING PHOTO FROM CLOUDINARY :: ", error);
        return null
        
    }
    

}
const deleteVideoOnCloudinary = async (URL) => {
    if(!URL){
        return null
    }
    const videoId = URL.match(
        /(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/
    )[2]
    console.log("DELETING VIDEO FROM CLOUDINARY !!!");
    try {
        const cloudinary_res = await cloudinary.uploader.destroy(
            `videoTube/video/${videoId}`,
            {
                resource_type: "video"
            }
        )

        return cloudinary_res
    } catch (error) {
        console.log("ERROR :: DELETING VIDEO FROM CLOUDINARY :: ", error);
        return null

    }
    
}
//  const uploadOnCloudinary = async (filePath) => {
//     try {
//         // uploading the file
//         if(!filePath) return ("Filepath not found ")
//         const response = await cloudinary.uploader.upload(filePath,{
//             resource_type: "auto"
//         })
//         //file uploaded
  
//         // since file uploaded , unlink file from fs
//         fs.unlinkSync(filePath)
//         return response;
//     } catch (error) {
//         // remove the file from fs , even if file upload failed for security purposes
//         fs.unlinkSync(filePath)
//         return null;
//     }
//  }

 export {
    uploadPhotoOnCloudinary,
    uploadVideoOnCloudinary,
    deletePhotoOnCloudinary,
    deleteVideoOnCloudinary
 }
import multer from "multer"


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    
    cb(null, Date.now() + file.originalname)
  }
})
  
export const upload = multer({ storage, })
// we use multer to handle uploading files as a middlewares for those routes which has upload file capabilities
// with multer we choose to store file in disk so (diskStorage), it gives 2 options to create destination, and filename
// cb is just a callback , name could be anything , but first param is to handle errors so we give "null"

import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
// we use cookie-parser to access the user browser cookies from our server to set them and check them (perform crud operations on them)

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// with this we handling CORS config , by setting the origin from env file to anywhere(*)

app.use(express.urlencoded({
    limit: "16kb",
    extended: true
}))
// to handle data which is came through URL

app.use(express.json({
    limit: "16kb"
}))

app.use(express.static("public"))
// when data like pdf, images  come to server so we store it in the local folder/assets which we name "public"

app.use(cookieParser())




// import Router 
import userRouter from "./routes/user.routes.js"


// routes declaration
app.use("/api/v1/users", userRouter)

// this will give http://localhost:8000/api/v1/users/
//  move to userRouter and get our /register or /login by calling their method
// we are not using .get as we are separating routes and controller (industry standard practise)


export { app }
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
// as we are passing cookie parser our req and res both have access to the Cookies




// import Router 
import userRouter from "./routes/user.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import aboutRouter from "./routes/about.routes.js"



// routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
// http://localhost:3000/api/v1/about/user
app.use("/api/v1/about/user/", aboutRouter);

// this will give http://localhost:8000/api/v1/users/
//  move to userRouter and get our /register or /login by calling their method
// we are not using .get as we are separating routes and controller (industry standard practise)


export { app }
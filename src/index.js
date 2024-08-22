// require('dotenv').config({path: "/env"})

// use dotenv to get all env as quickly as possible and since index.js is the first file to execute as per Nodemon
// its tricky to use dotenv with import statement , so some changes to package.json file 
// we have to the flag the nodemon and run this dotenv as a experimental

import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({path: "./env"})
connectDB()







/*
import express from "express"
const app = express()
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("error", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on PORT ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error("Error: ", error)
        throw error
    }
})()

In this approach we connect DB in index.js and while connecting always remember (DB is in another country) and (always use Try-Catch statement) but we will comment it out and learn second approach

*/
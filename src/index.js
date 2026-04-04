import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
    path:"./.env",
});

const PORT = process.env.Port || 8000;

connectDB()
    .then(()=>{
        app.listen(PORT,() => console.log(`Server is running on port: ${PORT}`))
    })
    .catch((err) => {
        console.log("Mongodb connection error",err);
        process.exit(1);
    })


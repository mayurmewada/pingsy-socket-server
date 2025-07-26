const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const url = process?.env?.MONGO_URI || "";
        mongoose.connect(url);
        const connection = await mongoose?.connection;
        connection?.on("connected", () => {
            console.log("✔ db connection successfull");
        });
        connection?.on("error", () => {
            console.log("✖ db connection failed " + error);
            process.exit();
        });
    } catch (error) {
        console.log("Something went wrong when connecting to DB");
        console.log(error);
    }
};

module.exports = connectDB;

const connectDB = require("./db");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const chatModel = require("./models/chat_model");
const { Server } = require("socket.io");

const app = express();

app.use(express.json());
app.use(cors());

app.use(
    cors({
        origin: (origin, callBack) => {
            if (!origin || origin === process.env.DOMAINREQACCESS) {
                callBack(null, true);
            } else {
                callBack(new Error("Not allowed by CORS"));
            }
        },
    })
);

connectDB().then(() => {
    app.listen(5000, () => {
        console.log("app listening on port 5000");
    });
});

app.use("/api/wakeup", async (req, res) => {
    try {
        return res.status(200).json({ message: "Socket is Ready to connect", code: "SOCKET_READY_TO_CONNECT" });
    } catch (error) {
        console.log("error:/api/wakeup", error);
    }
});
app.use("/api/socket", async (req, res) => {
    if (res?.socket?.server?.io) {
        console.log("socket.io already running...");
        res.end();
        return;
    }

    console.log("starting socket.io server...");

    const io = new Server(res?.socket?.server, {
        path: "/api/socket",
        addTrailingSlash: false,
        cors: { origin: "*" },
    });
    res.socket.server.io = io;

    io?.on("connection", (socket) => {
        console.log("New Connection", socket?.id);

        socket?.on("joinRoom", ({ chatId }) => {
            socket.join(chatId);
            console.log(`${socket?.id} joined chat ${chatId}`);
        });

        socket?.on("sendMessage", async ({ chatId, message, userId }) => {
            console.log("1------", userId);
            console.log("1------1", userId);
            const newMessage = await chatModel.findOneAndUpdate(
                { _id: chatId },
                {
                    $push: {
                        chat: {
                            message,
                            userId,
                            time: await new String(Date.now()),
                        },
                    },
                },
                { new: true, upsert: false, runValidators: true }
            );
            console.log("2------");

            await io?.to(chatId).emit("receiveMessage", {
                message,
                userId,
                time: await new String(Date.now()),
            });
            console.log("3------");
        });
    });
    res.end();
});

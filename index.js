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
app.use("/api/socket/refresh-friends", async (req, res) => {
    if (res?.socket?.server?.io?._path === "/api/socket/refresh-friends") {
        res.end();
        return;
    }

    console.log("starting refresh socket.io server...");

    const io = new Server(res?.socket?.server, {
        path: "/api/socket/refresh-friends",
        addTrailingSlash: false,
        cors: { origin: "*" },
    });
    res.socket.server.io = io;

    io?.on("connection", (socket) => {

        socket?.on("joinRoom", ({ userId }) => {
            socket.join(userId);
        });

        socket?.on("sendMessage", async ({ userId }) => {
            await io?.to(userId).emit("receiveMessage", { refresh: true });
        });
    });
    res.end();
});

app.use("/api/socket/chat", async (req, res) => {
    if (res?.socket?.server?.io === "/api/socket/chat") {
        console.log("socket.io already running...", res?.socket?.server);
        res.end();
        return;
    }

    console.log("starting socket.io server...");

    const io = new Server(res?.socket?.server, {
        path: "/api/socket/chat",
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

        socket?.on("sendMessage", async ({ chatId, message, userId, nonce }) => {
            const newMessage = await chatModel.findOneAndUpdate(
                { _id: chatId },
                {
                    $push: {
                        chat: {
                            message,
                            userId,
                            time: await new String(Date.now()),
                            nonce,
                        },
                    },
                },
                { new: true, upsert: false, runValidators: true }
            );

            await io?.to(chatId).emit("receiveMessage", {
                message,
                userId,
                time: await new String(Date.now()),
                nonce,
            });
        });
    });
    res.end();
});

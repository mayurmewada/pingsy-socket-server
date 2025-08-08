const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const chatMessageSchema = new mongoose.Schema({
    message: {
        type: Object,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    nonce: {
        type: Object,
        required: true,
    },
});

const chatSchema = new mongoose.Schema({
    _id: {
        type: String,
        unique: true,
        default: () => uuidv4(),
    },
    chat: {
        type: [chatMessageSchema],
        default: [],
    },
});

const chatModel = mongoose?.models?.chats || mongoose.model("chats", chatSchema);

module.exports = chatModel;

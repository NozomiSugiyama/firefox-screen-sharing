import * as fs from "fs";
import { listen } from "socket.io";

const server = listen(8080, {serveClient: false});

server.on("connection", (socket) => {
    let roomName = null;
    socket.on("enter", (x) => {
        roomName = x;
        socket.join(roomName);
    });

    socket.on("message", (message) => {
        message.from = socket.id;

        if (message.sendTo) {
            socket.to(message.sendTo).json.emit("message", message);
            return;
        }

        if (roomName) socket.broadcast.to(roomName).emit("message", message);
        else socket.broadcast.emit("message", message);
    });

    socket.on("disconnect", () => {
        if (roomName) socket.broadcast.to(roomName).emit("message", { from: socket.id, type: "bye"});
        else socket.broadcast.emit("message", { from: socket.id, type: "bye"});
    });
});

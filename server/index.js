const port = 8080;
const fs = require("fs");
const io = require("socket.io").listen(port);

io.sockets.on("connection", socket => {
    socket.on("enter", roomName => {
        socket.roomName = roomName;
        socket.join(roomName);
    });

    socket.on("message", message => {
        message.from = socket.id;

        if (message.sendTo) {
            socket.to(message.sendTo).json.emit("message", message);
            return;
        }

        if (socket.roomName) socket.broadcast.to(socket.roomName).emit("message", message);
        else socket.broadcast.emit(type, message);
    });

    socket.on("disconnect", () => {
        if (socket.roomName) socket.broadcast.to(socket.roomName).emit("message", { from: socket.id, type: "bye"});
        else socket.broadcast.emit(type, { from: socket.id, type: "bye"});
    });
});

const port = 8080;
const fs = require("fs");
const io = require("socket.io").listen(port);

io.sockets.on("connection", socket => {
    socket.on("enter", roomname => {
        socket.roomname = roomname;
        socket.join(roomname);
    });

    socket.on("message", message => {
        message.from = socket.id;

        if (message.sendTo) {
            socket.to(message.sendTo).json.emit("message", message);
            return;
        }

        emitMessage("message", message);
    });

    socket.on("disconnect", () => {
        emitMessage("bye");
    });

    const emitMessage = (type, message) => {
        const roomname = socket.roomname;
        if (roomname) { socket.broadcast.to(roomname).emit(type, message); }
        else { socket.broadcast.emit(type, message); }
    }
});

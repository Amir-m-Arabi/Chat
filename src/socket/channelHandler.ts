import { Socket, Server } from "socket.io";

export function channelHandlers(io: Server, socket: Socket) {
  socket.on("join_channel", (channelId: string) => {
    const room = `channel_${channelId}`;
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined room ${room}`);
  });

  socket.on("leave_channel", (channelId) => {
    const room = `channel_${channelId}`;
    socket.leave(room);
    console.log(`✅ Socket ${socket.id} left room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket ${socket.id} disconnected`);
  });
}

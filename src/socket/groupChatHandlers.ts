import { Server, Socket } from "socket.io";

export function groupChatHandlers(io: Server, socket: Socket) {
  // Join to group
  socket.on("join_group", (groupId: string) => {
    const room = `group_${groupId}`;
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined room ${room}`);
  });

  // Leave group
  socket.on("leave_group", (groupId) => {
    const room = `group_${groupId}`;
    socket.leave(room);
    console.log(`✅ Socket ${socket.id} left room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket ${socket.id} disconnected`);
  });
}

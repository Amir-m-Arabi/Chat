import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function chatHandlers(io: Server, socket: Socket) {
  // Join to private chat
  socket.on("join_chat", (chatId: string) => {
    const room = `chat_${chatId}`;
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined room ${room}`);
  });
  
  // Leave private chat
  socket.on("leave_chat", (chatId) => {
    const room = `chat_${chatId}`;
    socket.leave(room);
    console.log(`✅ Socket ${socket.id} left room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket ${socket.id} disconnected`);
  });
}

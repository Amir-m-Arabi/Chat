import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient()


export function chatHandlers(io: Server, socket: Socket) {
  socket.on("join_chat", (chatId: string) => {
    const room = `chat_${chatId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", async (data) => {
    // data = { chatId, senderId, content }

    // 1. ذخیره در DB
    await prisma.chatContent.create({
      data: {
        senderId: data.senderId,
        content: data.content,
        chatId: data.chatId
      }
    });

    // 2. ارسال به همه اعضای room
    const room = `chat_${data.chatId}`;
    socket.to(room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket ${socket.id} disconnected`);
  });
}

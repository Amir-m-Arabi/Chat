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

  // Send message in private chat
  socket.on("send_message", async (data) => {
    if (!data?.chatId || !data?.senderId || !data?.content) {
      socket.emit("error", { message: "Invalid data" });
      return;
    }

    await prisma.chatContent.create({
      data: {
        senderId: data.senderId,
        content: data.content,
        chatId: Number(data.chatId)
      }
    });

    const room = `chat_${data.chatId}`;
    socket.to(room).emit("receive_message", data);
  });

  // Edit message in private chat
  socket.on("edit_message", async (data) => {
    if (!data?.messageId || !data?.newContent || !data?.userId || !data?.chatId) {
      socket.emit("error", { message: "Invalid data" });
      return;
    }

    const messageId = Number(data.messageId);

    const message = await prisma.chatContent.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      socket.emit("error", { message: "Message not found" });
      return;
    }

    if (message.senderId !== data.userId) {
      socket.emit("error", { message: "Not allowed" });
      return;
    }

    const updated = await prisma.chatContent.update({
      where: { id: messageId },
      data: {
        content: data.newContent,
        isEdited: true
      }
    });

    const room = `chat_${data.chatId}`;
    io.to(room).emit("message_edited", {
      messageId: updated.id,
      newContent: updated.content,
      isEdited: updated.isEdited
    });
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

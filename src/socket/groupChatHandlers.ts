import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function groupChatHandlers(io: Server, socket: Socket) {
  // Join to group
  socket.on("join_group", (groupId: string) => {
    const room = `group_${groupId}`;
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined room ${room}`);
  });

  // Send message in group
  socket.on("send_message_to_group", async (data) => {
    if (!data?.groupId || !data?.senderId || !data?.content) {
      socket.emit("error", { message: "Invalid data" });
      return;
    }

    await prisma.groupChats.create({
      data: {
        senderId: data.senderId,
        content: data.content,
        groupId: Number(data.groupId),
      },
    });

    const room = `group_${data.groupId}`;
    socket.to(room).emit("receive_group_message", data);
  });

  // Edit message in group
  socket.on("edit_group_message", async (data) => {
    if (
      !data?.messageId ||
      !data?.newContent ||
      !data?.userId ||
      !data?.groupId
    ) {
      socket.emit("error", { message: "Invalid data" });
      return;
    }

    const messageId = Number(data.messageId);

    const message = await prisma.groupChats.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      socket.emit("error", { message: "Message not found" });
      return;
    }

    if (message.senderId !== data.userId) {
      socket.emit("error", { message: "Not allowed" });
      return;
    }

    const updated = await prisma.groupChats.update({
      where: { id: messageId },
      data: {
        content: data.newContent,
        isEdited: true,
      },
    });

    const room = `group_${data.groupId}`;
    io.to(room).emit("group_message_edited", {
      messageId: updated.id,
      newContent: updated.content,
      isEdited: updated.isEdited,
    });
  });

  socket.on("delete_group_message", async (data) => {
    if (!data?.messageId || !data?.userId || !data?.groupId) {
      socket.emit("error", { message: "Invalid data" });
      return;
    }

    const messageId = Number(data.messageId);

    const message = await prisma.groupChats.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      socket.emit("error", { message: "Message not found" });
      return;
    }

    if (message.senderId !== data.userId) {
      socket.emit("error", { message: "Not allowed" });
      return;
    }

    await prisma.groupChats.delete({
      where: {
        id: messageId,
      },
    });

    const room = `group_${data.groupId}`;
    io.to(room).emit("group_message_edited", {
      messageId: messageId,
    });
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

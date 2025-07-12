import express, { response } from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { Server, Socket } from "socket.io";

const prisma = new PrismaClient();

export async function secrchByUsername(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "" });
    }

    const user = await prisma.user.findMany({
      where: {
        username,
      },
      select: {
        id: true,
        username: true,
        profileURL: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "" });
    }

    return res.status(200).json({ message: "", data: user });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function startContact(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const io = req.app.get("io");
    const firstPersonID = req.cookies.userData?.id;
    const { secondPersonID, content } = req.body;

    if (!firstPersonID || !secondPersonID || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1. ایجاد Contact
    const makeContact = await prisma.contact.create({
      data: {
        firstPersonID,
        secondPersonID,
      },
      select: { id: true },
    });

    // 2. ثبت اولین پیام
    const message = await prisma.chatContent.create({
      data: {
        senderId: firstPersonID,
        content,
        chatId: makeContact.id,
      },
    });

    io.to(`chat_${makeContact.id}`).emit("start_chat", { data: message });

    // 3. ریترن به کلاینت
    return res.status(201).json({
      message: "Contact created",
      data: message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function sendMessage(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const senderId = req.cookies.userData.ID;

    if (!senderId) {
      return res.status(400).json({ message: "" });
    }

    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ message: "" });
    }

    const chat = await prisma.contact.findUnique({
      where: {
        id: Number(chatId),
      },
    });

    if (!chat) {
      return res.status(400).json({ message: "" });
    }

    if (
      chat.firstPersonID === String(senderId) ||
      chat.secondPersonID === String(senderId)
    ) {
      const message = await prisma.chatContent.create({
        data: {
          senderId: String(senderId),
          content,
          chatId: Number(chatId),
        },
      });

      io.to(`chat_${chatId}`).emit("send_message", message);

      return res.status(200).json({ message: "" });
    }

    return res.status(400).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function editMessage(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const senderId = req.cookies.userData.id;

    if (!senderId) {
      return res.status(400).json({ message: "" });
    }

    const { chatId, newContent, messageId } = req.body;

    if (!chatId || !newContent || !messageId) {
      return res.status(400).json({ message: "" });
    }

    const chat = await prisma.contact.findUnique({
      where: {
        id: Number(chatId),
      },
    });

    if (!chat) {
      return res.status(400).json({ message: "" });
    }

    if (
      chat.firstPersonID !== String(senderId) &&
      chat.secondPersonID !== String(senderId)
    ) {
      return res.status(400).json({ message: "" });
    }

    const newMessage = await prisma.chatContent.update({
      where: {
        id: Number(messageId),
        chatId: Number(chatId),
      },
      data: {
        content: String(newContent),
        isEdited: true,
      },
    });

    io.to(`chat_${chatId}`).emit("message_edited", newMessage);
    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteContact(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const userId = req.cookies.userData?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ message: "Missing chatId" });
    }

    const messages = await prisma.chatContent.findMany({
      where: {
        chatId: Number(chatId),
      },
    });

    if (messages.length === 0) {
      return res
        .status(404)
        .json({ message: "No messages found for this chat" });
    }

    // جدا کردن پیام‌های طرف مقابل
    const theirMessages = messages.filter(
      (msg: any) => msg.senderId !== userId
    );

    // حذف پیام‌های خود کاربر
    await prisma.chatContent.deleteMany({
      where: {
        chatId: Number(chatId),
        senderId: userId,
      },
    });

    if (theirMessages.length > 0) {
      io.to(`chat_${chatId}`).emit("user_messages_deleted", {
        userId: userId,
      });
      // طرف مقابل هنوز پیام داره → کانتکت باقی می‌مونه
      return res.status(200).json({ message: "Your messages deleted" });
    } else {
      // هیچ پیام دیگه‌ای باقی نمونده → کانتکت رو هم حذف کن
      await prisma.contact.delete({
        where: {
          id: Number(chatId),
        },
      });

      io.to(`chat_${chatId}`).emit("contact_deleted", {
        chatId: chatId,
      });

      return res.status(200).json({ message: "Contact deleted" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteChat(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const senderId = req.cookies.userData.id;

    if (!senderId) {
      return res.status(400).json({ message: "" });
    }

    const { chatId, id } = req.params;

    if (!chatId || !id) {
      return res.status(400).json({ message: "" });
    }

    const message = await prisma.chatContent.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        senderId: true,
      },
    });

    if (!message) {
      return res.status(400).json({ message: "" });
    }

    if (message.senderId !== String(senderId)) {
      return res.status(400).json({ message: "" });
    }

    await prisma.chatContent.delete({
      where: {
        id: Number(id),
      },
    });

    io.to(`chat_${chatId}`).emit("delete_message", {
      messageId: id,
    });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function getAllChatInContact(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const userId = req.cookies.userData.id;

    const { chatId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "" });
    }

    const messages = await prisma.chatContent.findMany({
      where: {
        chatId: Number(chatId),
      },
    });

    if (!messages) {
      return res.status(400).json({ message: "" });
    }

    const myMessage = messages.filter((msg: any) => msg.senderId === userId);
    const theirMessage = messages.filter((msg: any) => msg.senderId !== userId);

    return res
      .status(200)
      .json({ messages: "", myMessage: myMessage, theirMessage: theirMessage });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

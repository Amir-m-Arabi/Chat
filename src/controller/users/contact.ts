import express from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { create } from "domain";

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
    const {
      secondPersonID,
      content = "",
      videos = [],
      images = [],
      audios = [],
      files = [],
    } = req.body;

    if (!firstPersonID || !secondPersonID) {
      return res.status(400).json({ message: "Missing user IDs" });
    }

    const makeContact = await prisma.contact.create({
      data: {
        firstPersonID,
        secondPersonID,
      },
      select: { id: true },
    });

    const message = await prisma.chatContent.create({
      data: {
        senderId: firstPersonID,
        content,
        chatId: makeContact.id,
        video: videos.length
          ? { create: videos.map((url: string) => ({ videoURL: url })) }
          : undefined,
        image: images.length
          ? { create: images.map((url: string) => ({ imageURL: url })) }
          : undefined,
        audio: audios.length
          ? { create: audios.map((url: string) => ({ audioURL: url })) }
          : undefined,
        file: files.length
          ? { create: files.map((url: string) => ({ fileURL: url })) }
          : undefined,
      },
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
      },
    });

    io.to(`chat_${makeContact.id}`).emit("start_chat", { data: message });

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
    const senderId = req.cookies.userData?.id;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      content = "",
      chatId,
      videos = [],
      images = [],
      audios = [],
      files = [],
    } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    const chat = await prisma.contact.findUnique({
      where: { id: Number(chatId) },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (
      chat.firstPersonID !== String(senderId) &&
      chat.secondPersonID !== String(senderId)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const message = await prisma.chatContent.create({
      data: {
        senderId: String(senderId),
        content,
        chatId: Number(chatId),
        video: videos.length
          ? { create: videos.map((url: string) => ({ videoURL: url })) }
          : undefined,
        image: images.length
          ? { create: images.map((url: string) => ({ imageURL: url })) }
          : undefined,
        audio: audios.length
          ? { create: audios.map((url: string) => ({ audioURL: url })) }
          : undefined,
        file: files.length
          ? { create: files.map((url: string) => ({ fileURL: url })) }
          : undefined,
      },
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
      },
    });

    io.to(`chat_${chatId}`).emit("send_message", message);

    return res.status(200).json({
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
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
    const senderId = req.cookies.userData?.id;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { chatId, messageId, newContent, videos, images, audios, files } =
      req.body;

    if (!chatId || !messageId) {
      return res
        .status(400)
        .json({ message: "chatId and messageId are required" });
    }

    const chat = await prisma.contact.findUnique({
      where: { id: Number(chatId) },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (
      chat.firstPersonID !== String(senderId) &&
      chat.secondPersonID !== String(senderId)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const uploadsBase = path.join(__dirname, "..", "uploads");

    if (newContent !== undefined && newContent !== null) {
      await prisma.chatContent.update({
        where: { id: Number(messageId) },
        data: { content: String(newContent), isEdited: true },
      });
    }

    if (videos && videos.length > 0) {
      for (const video of videos) {
        const oldVideo = await prisma.video.findUnique({
          where: { id: Number(video.id) },
        });

        if (oldVideo && oldVideo.videoURL !== video.videoURL) {
          const oldPath = path.join(uploadsBase, oldVideo.videoURL);
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Error deleting old video:", err);
          });
        }

        await prisma.video.update({
          where: { id: Number(video.id) },
          data: { videoURL: video.videoURL },
        });
      }
    }

    if (images && images.length > 0) {
      for (const image of images) {
        const oldImage = await prisma.image.findUnique({
          where: { id: Number(image.id) },
        });

        if (oldImage && oldImage.imageURL !== image.imageURL) {
          const oldPath = path.join(uploadsBase, oldImage.imageURL);
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }

        await prisma.image.update({
          where: { id: Number(image.id) },
          data: { imageURL: image.imageURL },
        });
      }
    }

    if (audios && audios.length > 0) {
      for (const audio of audios) {
        const oldAudio = await prisma.audio.findUnique({
          where: { id: Number(audio.id) },
        });

        if (oldAudio && oldAudio.audioURL !== audio.audioURL) {
          const oldPath = path.join(uploadsBase, oldAudio.audioURL);
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Error deleting old audio:", err);
          });
        }

        await prisma.audio.update({
          where: { id: Number(audio.id) },
          data: { audioURL: audio.audioURL },
        });
      }
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const oldFile = await prisma.file.findUnique({
          where: { id: Number(file.id) },
        });

        if (oldFile && oldFile.fileURL !== file.fileURL) {
          const oldPath = path.join(uploadsBase, oldFile.fileURL);
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Error deleting old audio:", err);
          });
        }

        await prisma.file.update({
          where: { id: Number(file.id) },
          data: { fileURL: file.fileURL },
        });
      }
    }

    const updatedMessage = await prisma.chatContent.findUnique({
      where: { id: Number(messageId) },
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
      },
    });

    io.to(`chat_${chatId}`).emit("message_edited", updatedMessage);

    return res.status(200).json({
      message: "Message updated",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
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

    const theirMessages = messages.filter(
      (msg: any) => msg.senderId !== userId
    );

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
      return res.status(200).json({ message: "Your messages deleted" });
    } else {
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
    const senderId = req.cookies.userData?.id;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { chatId, id } = req.params;

    if (!chatId || !id) {
      return res
        .status(400)
        .json({ message: "chatId and messageId are required" });
    }

    const message = await prisma.chatContent.findUnique({
      where: { id: Number(id) },
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
      },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId !== String(senderId)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    const uploadsBase = path.join(__dirname, "..", "uploads");

    for (const vid of message.video) {
      const videoPath = path.join(uploadsBase, vid.videoURL);
      fs.unlink(videoPath, (err) => {
        if (err) console.error("Error deleting video:", err);
      });
    }

    for (const img of message.image) {
      const imagePath = path.join(uploadsBase, img.imageURL);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    for (const aud of message.audio) {
      const audioPath = path.join(uploadsBase, aud.audioURL);
      fs.unlink(audioPath, (err) => {
        if (err) console.error("Error deleting audio:", err);
      });
    }

    for (const file of message.file) {
      const filePath = path.join(uploadsBase, file.fileURL);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting audio:", err);
      });
    }

    await prisma.chatContent.delete({
      where: { id: Number(id) },
    });

    io.to(`chat_${chatId}`).emit("delete_message", {
      messageId: id,
    });

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
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
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
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

export async function searchInChat(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const userId = req.cookies.userData.id;

    if (!userId) {
      return res.status(400).json({ message: "" });
    }

    const { chatId, value } = req.body;

    if (!chatId || !value || value.trim() === "") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const chat = await prisma.contact.findUnique({
      where: {
        id: Number(chatId),
      },
      select: {
        firstPersonID: true,
        secondPersonID: true,
      },
    });

    if (!chat) {
      return res.status(400).json({ message: "" });
    }

    if (
      chat.firstPersonID !== String(userId) &&
      chat.secondPersonID !== String(userId)
    ) {
      return res.status(400).json({ message: "" });
    }

    const contents = await prisma.chatContent.findMany({
      where: {
        chatId: Number(chatId),
        content: {
          contains: value,
        },
      },
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return res.status(200).json({ message: "Results found", data: contents });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

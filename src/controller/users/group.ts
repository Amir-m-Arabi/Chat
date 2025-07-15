import express from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { create } from "domain";

const prisma = new PrismaClient();

export async function addGroup(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const { groupName, description = "", profileURL = "" } = req.body;

    if (!groupName) {
      return res.status(400).json({ message: "" });
    }

    await prisma.group.create({
      data: {
        groupName,
        description,
        profileURL,
        adminId: String(adminId),
      },
    });

    return res.status(200).json({
      message: "",
      data: {
        groupName: groupName,
        description: description,
        profileURL: profileURL,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

export async function addGroupMember(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const { groupId, membersId } = req.body;

    if (!groupId || !Array.isArray(membersId) || membersId.length === 0) {
      return res.status(400).json({ message: "" });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
      select: {
        adminId: true,
      },
    });

    if (!group) {
      return res.status(400).json({ message: "" });
    }

    if (group.adminId === String(adminId)) {
      for (const memberId of membersId) {
        await prisma.groupMember.create({
          data: {
            memberId,
            groupId: Number(groupId),
          },
        });
      }

      io.to(`group_${groupId}`).emit("members_added", { members: membersId });

      return res.status(200).json({ message: "" });
    } else {
      return res.status(400).json({ message: "" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function addMessage(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const userId = req.cookies.userData.id;

    if (!userId) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const { groupId, content = "", videos, images, audios, files } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: "groupId is required" });
    }

    const members = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
      select: {
        adminId: true,
        groupMember: {
          select: {
            memberId: true,
          },
        },
      },
    });

    if (!members) {
      return res.status(400).json({ message: "" });
    }

    if (
      members.adminId !== String(userId) &&
      !members.groupMember.some(
        (memberId) => memberId.memberId === String(userId)
      )
    ) {
      return res.status(400).json({ message: "" });
    }

    const createData: any = {
      senderId: String(userId),
      content,
      channelId: Number(groupId),
    };

    if (videos && videos.length > 0) {
      createData.video = {
        create: videos.map((url: any) => ({ videoURL: url })),
      };
    }

    if (images && images.length > 0) {
      createData.image = {
        create: images.map((url: any) => ({ imageURL: url })),
      };
    }

    if (audios && audios.length > 0) {
      createData.audio = {
        create: audios.map((url: any) => ({ audioURL: url })),
      };
    }

    if (files && files.length > 0) {
      createData.file = {
        create: files.map((url: any) => ({ fileURL: url })),
      };
    }

    const message = await prisma.groupChats.create({
      data: createData,
      include: {
        video: true,
        image: true,
        audio: true,
        file: true,
      },
    });

    io.to(`group_${groupId}`).emit("messages_added", { message: message });

    return res.status(200).json({ message: "" });
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

    const { groupId, messageId, newContent, videos, images, audios, files } =
      req.body;

    if (!groupId || !messageId) {
      return res.status(400).json({ message: "" });
    }

    const message = await prisma.groupChats.findUnique({
      where: {
        id: Number(messageId),
        groupId: Number(groupId),
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

    if (newContent !== undefined && newContent !== null) {
      await prisma.channelContent.update({
        where: { id: Number(messageId) },
        data: { content: newContent },
      });
    }

    if (videos && videos.length > 0) {
      for (const video of videos) {
        const oldVideo = await prisma.video.findUnique({
          where: { id: Number(video.id) },
        });

        if (oldVideo && oldVideo.videoURL !== video.videoURL) {
          const oldPath = path.join(__dirname, "..", oldVideo.videoURL);
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
          const oldPath = path.join(__dirname, "..", oldImage.imageURL);
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
          const oldPath = path.join(__dirname, "..", oldAudio.audioURL);
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
          const oldPath = path.join(__dirname, "..", oldFile.fileURL);
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

    io.to(`group${groupId}`).emit("content edited", {
      groupId,
      messageId,
      newContent,
      videos,
      images,
      audios,
      files,
    });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteMessagesByAdmin(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const { groupId, messagesId } = req.body;

    if (groupId || !Array.isArray(messagesId) || messagesId.length === 0) {
      return res.status(400).json({ message: "" });
    }

    const groupAdmin = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
      select: {
        adminId: true,
      },
    });

    if (!groupAdmin) {
      return res.status(400).json({ message: "" });
    }

    if (groupAdmin.adminId !== String(adminId)) {
      return res.status(400).json({ message: "" });
    }

    const contentsWithMedia = await prisma.channelContent.findMany({
      where: {
        id: { in: messagesId.map(Number) },
      },
      select: {
        id: true,
        video: { select: { id: true, videoURL: true } },
        image: { select: { id: true, imageURL: true } },
        audio: { select: { id: true, audioURL: true } },
        file: { select: { id: true, fileURL: true } },
      },
    });

    for (const content of contentsWithMedia) {
      for (const vid of content.video) {
        const filePath = path.join(__dirname, "..", vid.videoURL);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting video:", err);
        });
      }

      for (const img of content.image) {
        const filePath = path.join(__dirname, "..", img.imageURL);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting image:", err);
        });
      }

      for (const aud of content.audio) {
        const filePath = path.join(__dirname, "..", aud.audioURL);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting audio:", err);
        });
      }

      for (const file of content.file) {
        const filePath = path.join(__dirname, "..", file.fileURL);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting audio:", err);
        });
      }
    }

    await prisma.channelContent.deleteMany({
      where: { id: { in: messagesId.map(Number) } },
    });

    io.to(`group_${groupId}`).emit("messages_deleted", {
      messages: messagesId,
      groupId,
      deletedContents: contentsWithMedia,
    });
    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteMemberByAdmin(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const { groupId, membersId } = req.body;

    if (!groupId || !Array.isArray(membersId) || membersId.length === 0) {
      return res.status(400).json({ message: "" });
    }

    const groupAdmin = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
      select: {
        adminId: true,
      },
    });

    if (!groupAdmin) {
      return res.status(400).json({ message: "" });
    }

    if (groupAdmin.adminId === String(adminId)) {
      for (const memberId of membersId) {
        await prisma.groupMember.delete({
          where: {
            id: Number(memberId),
          },
        });
      }

      io.to(`group_${groupId}`).emit("members_removed", { members: membersId });

      return res.status(200).json({ message: "" });
    }

    return res.status(400).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteMemberById(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const memberId = req.cookies.userData.id;

    if (!memberId) {
      return res.status(400).json({ message: "" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "" });
    }

    const remove = await prisma.groupMember.delete({
      where: {
        id: Number(id),
        memberId: String(memberId),
      },
      select: {
        groupId: true,
      },
    });

    if (!remove) {
      return res.status(400).json({ message: "" });
    }

    await prisma.groupChats.updateMany({
      where: {
        groupId: Number(remove.groupId),
        senderId: String(memberId),
      },
      data: {
        senderId: "",
      },
    });

    io.to(`group_${remove.groupId}`).emit("member_removed");

    return res.status(200).json({ message: "" });
  } catch (error) {
    return res.status(400).json({ message: "" });
  }
}

export async function deleteMessageById(
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

    const { groupId, messageId } = req.body;

    if (!groupId || !messageId) {
      return res.status(400).json({ message: "" });
    }

    const message = await prisma.groupChats.findUnique({
      where: {
        id: Number(messageId),
        groupId: Number(groupId),
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

    const content = await prisma.groupChats.findUnique({
      where: {
        id: Number(messageId),
        groupId: Number(groupId),
      },
      select: {
        video: { select: { id: true, videoURL: true } },
        image: { select: { id: true, imageURL: true } },
        audio: { select: { id: true, audioURL: true } },
        file: { select: { id: true, fileURL: true } },
      },
    });

    if (!content) {
      return res.status(400).json({ message: "" });
    }

    for (const vid of content.video) {
      const filePath = path.join(__dirname, "..", vid.videoURL);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting video:", err);
      });
    }

    for (const img of content.image) {
      const filePath = path.join(__dirname, "..", img.imageURL);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting image:", err);
      });
    }

    for (const aud of content.audio) {
      const filePath = path.join(__dirname, "..", aud.audioURL);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting audio:", err);
      });
    }

    for (const file of content.file) {
      const filePath = path.join(__dirname, "..", file.fileURL);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting audio:", err);
      });
    }

    await prisma.groupChats.delete({
      where: {
        id: Number(messageId),
        groupId: Number(groupId),
      },
    });

    io.to(`group_${groupId}`).emit("message_deleted", {
      messageId: messageId,
      groupId: groupId,
      deleteContent: content,
    });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteGroup(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "" });
    }

    await prisma.group.delete({
      where: {
        id: Number(id),
        adminId: String(adminId),
      },
      include: {
        groupChats: true,
        groupMember: true,
      },
    });

    io.to(`group_${id}`).emit("group_deleted", { groupId: id });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function getAllMessage(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "" });
    }

    const messages = await prisma.groupChats.findMany({
      where: {
        id: Number(groupId),
      },
    });

    if (!messages) {
      return res.status(400).json({ message: "" });
    }

    return res.status(200).json({ message: "", data: messages });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function showBiography(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "" });
    }

    const biography = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
      include: {
        groupMember: true,
      },
    });

    let members: {
      [key: string]: { username: string; profileURL: string } | null;
    } = {};
    if (!biography) {
      return res.status(400).json({ message: "" });
    }

    for (const memberId of biography.groupMember) {
      const user = await prisma.user.findUnique({
        where: {
          id: Number(memberId),
        },
        select: {
          id: true,
          username: true,
          profileURL: true,
        },
      });

      if (user) {
        members[user.id] = {
          username: user.username,
          profileURL: user.profileURL,
        };
      }
    }

    return res
      .status(200)
      .json({ message: "", data: { biography: biography, members: members } });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function searchInChannel(
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

    const { groupId, value } = req.body;

    if (!groupId || !value || value.trim() === "") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const members = await prisma.group.findUnique({
      where: {
        id: Number(groupId),
      },
      select: {
        adminId: true,
        groupMember: {
          select: {
            memberId: true,
          },
        },
      },
    });

    if (!members) {
      return res.status(400).json({ message: "" });
    }

    if (
      members.adminId !== String(userId) &&
      !members.groupMember.some(
        (memberId) => memberId.memberId === String(userId)
      )
    ) {
      return res.status(400).json({ message: "" });
    }

    const contents = await prisma.groupChats.findMany({
      where: {
        groupId: Number(groupId),
        content: {
          contains: value,
        },
      },
      include: {
        video: true,
        image: true,
        audio: true,
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

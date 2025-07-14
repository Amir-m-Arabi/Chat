import express from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function createChannel(
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

    const { profileURL = "", channelName, description } = req.body;

    if (!channelName || !description) {
      return res.status(400).json({ message: "" });
    }

    const channel: any = {
      channelName,
      profileURL,
      description,
      superAdminId: String(userId),
    };

    if (req.file) {
      channel.profileURL = `/uploads/profile/${req.file.filename}`;
    }

    await prisma.createChannel.create({
      data: channel,
    });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
}

export async function addAdminToChannel(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const superAdminId = req.cookies.userData.id;

    if (!superAdminId) {
      return res.status(400).json({ message: "" });
    }

    const { adminsId, channelId } = req.body;

    if (!channelId || Array.isArray(adminsId) || adminsId.length === 0) {
      return res.status(400).json({ message: "" });
    }

    const channel = await prisma.createChannel.findUnique({
      where: {
        id: Number(channelId),
      },
      select: {
        superAdminId: true,
      },
    });

    if (!channel) {
      return res.status(400).json({ message: "" });
    }

    if (channel.superAdminId !== String(superAdminId)) {
      return res.status(400).json({ message: "" });
    }

    for (const adminId of adminsId) {
      await prisma.channelAdmins.create({
        data: {
          adminId: String(adminId),
          channelId: Number(channelId),
        },
      });
    }

    return res.status(400).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function biographyEdited(
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
      return res.status(400).json({ message: "" });
    }

    const { id } = req.params;

    const { profileURL = "", channelName, description = "" } = req.body;

    if (!channelName || !description) {
      return res.status(400).json({ message: "" });
    }

    const channel = await prisma.createChannel.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        superAdminId: true,
        channelAdmins: {
          select: {
            adminId: true,
          },
        },
      },
    });

    if (
      !channel ||
      (channel.superAdminId !== userId &&
        !channel.channelAdmins.some((admin) => admin.adminId === userId))
    ) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const biographyData: any = {
      channelName,
      description,
    };

    if (req.file) {
      biographyData.profileURL = `/uploads/profile/${req.file.filename}`;
    }

    const update_channel = await prisma.createChannel.update({
      where: {
        id: Number(id),
      },
      data: biographyData,
      select: {
        channelName: true,
        profileURL: true,
        description: true,
      },
    });

    io.to(`channel_${id}`).emit("biography edited", update_channel);

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
}

export async function deleteChannel(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const io = req.app.get("io");
    const superAdminId = req.cookies.userData?.id;

    if (!superAdminId) {
      return res.status(400).json({ message: "" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "" });
    }

    const channel = await prisma.createChannel.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        superAdminId: true,
      },
    });

    if (!channel) {
      return res.status(400).json({ message: "" });
    }

    if (channel.superAdminId !== String(superAdminId)) {
      return res.status(400).json({ message: "" });
    }

    await prisma.createChannel.delete({
      where: {
        id: Number(id),
      },
    });

    io.to(`channel_${id}`).emit("channel deleted", { channel: id });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
}

export async function getChannel(
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
      return res.status(400).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { before } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Channel ID is required" });
    }

    const channel = await prisma.createChannel.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        channelAdmins: true,
        followChannels: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const contentWhere: any = {
      channelId: Number(id),
    };

    if (before) {
      contentWhere.createdAt = {
        lt: new Date(before as string),
      };
    }

    // ✅ 3️⃣ بگیر پیام‌ها (paginated)
    const channelContent = await prisma.channelContent.findMany({
      where: contentWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        video: true,
        audio: true,
        image: true,
      },
    });

    const isAdmin =
      channel.superAdminId === userId ||
      channel.channelAdmins.some((admin) => admin.adminId === userId);

    if (isAdmin) {
      const followers = channel.followChannels.map(
        (follow: any) => follow.user
      );

      return res.status(200).json({
        message: "Channel fetched successfully",
        data: {
          channelId: channel.id,
          channelName: channel.channelName,
          profileURL: channel.profileURL,
          description: channel.description,
          superAdminId: channel.superAdminId,
          admins: channel.channelAdmins,
          followers: followers,
          contents: channelContent,
        },
      });
    }

    return res.status(200).json({
      message: "Channel fetched successfully",
      data: {
        channelId: channel.id,
        channelName: channel.channelName,
        profileURL: channel.profileURL,
        description: channel.description,
        contents: channelContent,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

// ========================= Follow Func ===================================

export async function addFollowChannel(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const userId = req.cookies.userData.id;

    const { channelId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "" });
    }

    if (!channelId) {
      return res.status(400).json({ message: "" });
    }

    const follow = await prisma.followChannels.create({
      data: {
        userId,
        channelId: Number(channelId),
      },
    });

    if (!follow) {
      return res.status(400).json({ message: "" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
}

export async function deleteFollow(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const id = req.params;

    if (!id) {
      return res.status(400).json({ message: "" });
    }

    await prisma.followChannels.delete({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
}

//======================================  Chat Funcs ==========================================

export async function addContent(
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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content = "", channelId, videos, images, audios } = req.body;

    if (!channelId) {
      return res.status(400).json({ message: "channelId is required" });
    }

    // Check permissions
    const channel = await prisma.createChannel.findUnique({
      where: { id: Number(channelId) },
      select: {
        superAdminId: true,
        channelAdmins: { select: { adminId: true } },
      },
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (
      channel.superAdminId !== String(adminId) &&
      !channel.channelAdmins.some((admin) => admin.adminId === String(adminId))
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const createData: any = {
      senderId: String(adminId),
      content,
      channelId: Number(channelId),
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

    // Create
    const message = await prisma.channelContent.create({
      data: createData,
      include: {
        video: true,
        image: true,
        audio: true,
      },
    });

    io.to(`channel_${channelId}`).emit("send messages", { message });

    return res.status(201).json({
      message: "Content created",
      data: message,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function editContent(
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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { channelId, contentId, newContent, videos, images, audios } =
      req.body;

    if (!contentId) {
      return res.status(400).json({ message: "contentId is required" });
    }

    const admins = await prisma.createChannel.findUnique({
      where: { id: Number(channelId) },
      select: {
        superAdminId: true,
        channelAdmins: { select: { adminId: true } },
      },
    });

    if (
      !admins ||
      (admins.superAdminId !== String(senderId) &&
        !admins.channelAdmins.some((a) => a.adminId === String(senderId)))
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (newContent !== undefined && newContent !== null) {
      await prisma.channelContent.update({
        where: { id: Number(contentId) },
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

    io.to(`channel_${channelId}`).emit("content edited", {
      channelId,
      contentId,
      newContent,
      videos,
      images,
      audios,
    });

    return res.status(200).json({ message: "Content updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function deleteContent(
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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { channelId, contentsId } = req.body;

    if (!channelId || !Array.isArray(contentsId) || contentsId.length === 0) {
      return res.status(400).json({
        message: "channelId and contentsId array are required",
      });
    }

    const channel = await prisma.createChannel.findUnique({
      where: { id: Number(channelId) },
      select: {
        superAdminId: true,
        channelAdmins: { select: { adminId: true } },
      },
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const isAdmin =
      channel.superAdminId === String(adminId) ||
      channel.channelAdmins.some((admin) => admin.adminId === String(adminId));

    if (!isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const contentsWithMedia = await prisma.channelContent.findMany({
      where: {
        id: { in: contentsId.map(Number) },
      },
      select: {
        id: true,
        video: { select: { id: true, videoURL: true } },
        image: { select: { id: true, imageURL: true } },
        audio: { select: { id: true, audioURL: true } },
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
    }

    await prisma.channelContent.deleteMany({
      where: { id: { in: contentsId.map(Number) } },
    });

    io.to(`channel_${channelId}`).emit("content deleted", {
      channelId,
      deletedContents: contentsWithMedia,
    });

    return res.status(200).json({
      message: "Contents deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
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
    const { channelId, value } = req.body;

    if (!channelId || !value || value.trim() === "") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const contents = await prisma.channelContent.findMany({
      where: {
        channelId: Number(channelId),
        content: {
          contains: value,
        },
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

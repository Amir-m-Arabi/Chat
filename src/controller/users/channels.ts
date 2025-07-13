import express from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { resolveSoa } from "dns";

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

    const { profileURL, channelName, description } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "" });
    }

    if (!profileURL || !channelName || !description) {
      return res.status(400).json({ message: "" });
    }

    await prisma.createChannel.create({
      data: {
        channelName,
        profileURL,
        description,
        superAdminId: String(userId),
      },
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

    if (!profileURL || !channelName || !description) {
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

    const update_channel = await prisma.createChannel.update({
      where: {
        id: Number(id),
      },
      data: {
        channelName,
        profileURL,
        description,
      },
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

    // ✅ 1️⃣ بگیر اطلاعات کانال، شامل Admin و Follows (برای چک)
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

    // ✅ 2️⃣ بساز شرط برای پیام‌ها
    const contentWhere: any = {
      channelId: Number(id),
    };

    if (before) {
      contentWhere.createdAt = {
        lt: new Date(before as string)
      };
    }

    // ✅ 3️⃣ بگیر پیام‌ها (paginated)
    const channelContent = await prisma.channelContent.findMany({
      where: contentWhere,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // ✅ 4️⃣ چک کن کاربر ادمین یا سوپرادمینه؟
    const isAdmin =
      channel.superAdminId === userId ||
      channel.channelAdmins.some((admin) => admin.adminId === userId);

    // ✅ 5️⃣ پاسخ برای Admin
    if (isAdmin) {
      const followers = channel.followChannels.map((follow: any) => follow.user);

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
          contents: channelContent
        }
      });
    }

    // ✅ 6️⃣ پاسخ برای کاربر عادی
    return res.status(200).json({
      message: "Channel fetched successfully",
      data: {
        channelId: channel.id,
        channelName: channel.channelName,
        profileURL: channel.profileURL,
        description: channel.description,
        contents: channelContent
      }
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
      return res.status(400).json({ message: "" });
    }

    const { contents, channelId } = req.body;

    if (!Array.isArray(contents) || !channelId) {
      return res.status(400).json({ message: "" });
    }

    const channel = await prisma.createChannel.findUnique({
      where: {
        id: Number(channelId),
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

    if (!channel) {
      return res.status(400).json({ message: "" });
    }

    if (
      channel.superAdminId !== String(adminId) &&
      !channel.channelAdmins.some((admin) => admin.adminId === String(adminId))
    ) {
      return res.status(400).json({ message: "" });
    }

    let contentsId: { [key: string]: { username: string } | null } = {};

    for (const content of contents) {
      const message = await prisma.channelContent.create({
        data: {
          senderId: String(adminId),
          content,
          channelId: Number(channelId),
        },
      });

      contentsId[message.id] = content;
    }

    io.to(`channel_${channelId}`).emit("send messages", {
      channelId: channelId,
      contents: contentsId,
    });

    return res.status(400).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
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
      return res.status(400).json({ message: "" });
    }

    const { channelId, newContent, contentId } = req.body;

    if (!channelId || !newContent || !contentId) {
      return res.status(400).json({ message: "" });
    }

    const admins = await prisma.createChannel.findUnique({
      where: {
        id: Number(channelId),
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

    if (!admins) {
      return res.status(400).json({ message: "" });
    }

    if (
      admins.superAdminId !== String(senderId) &&
      !admins.channelAdmins.some((admin) => admin.adminId === String(senderId))
    ) {
      return res.status(400).json({ message: "" });
    }

    await prisma.channelContent.update({
      where: {
        id: Number(contentId),
      },
      data: {
        content: newContent,
      },
    });

    io.to(`channel_${channelId}`).emit("content edited", {
      channelId,
      contentId,
      newContent,
    });

    return res.status(200).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteContent(
  req: express.Request,
  res: express.Response
): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ message: "" });
  }

  try {
    const io = req.app.get("io");
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const { channelId, contentsId } = req.body;

    if (!channelId || !Array.isArray(contentsId) || contentsId.length === 0) {
      return res.status(400).json({ message: "" });
    }

    const admins = await prisma.createChannel.findUnique({
      where: {
        id: Number(channelId),
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

    if (!admins) {
      return res.status(400).json({ message: "" });
    }

    if (
      admins.superAdminId !== String(adminId) &&
      !admins.channelAdmins.some((admin) => admin.adminId === String(adminId))
    ) {
      return res.status(400).json({ message: "" });
    }

    for (const contentId of contentsId) {
      await prisma.channelContent.delete({
        where: {
          id: Number(contentId),
        },
      });
    }

    io.to(`channel_${channelId}`).emit("content deleted", {
      channelId: channelId,
      contentsId: contentsId,
    });

    return res.status(200).json({ message: "" });
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

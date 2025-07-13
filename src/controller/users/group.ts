import express from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";

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
    const memberId = req.cookies.userData.id;

    if (!memberId) {
      return res.status(400).json({ message: "" });
    }

    const { groupId, content } = req.body;

    if (!groupId || !content) {
      return res.status(400).json({ message: "" });
    }

    const members = await prisma.groupMember.findMany({
      where: {
        groupId: Number(groupId),
      },
      select: {
        memberId: true,
      },
    });

    if (!members) {
      return res.status(400).json({ message: "" });
    }

    for (const member of members) {
      if (member.memberId === String(memberId)) {
        const message = await prisma.groupChats.create({
          data: {
            senderId: String(memberId),
            content,
            groupId: Number(groupId),
          },
        });

        io.to(`group_${groupId}`).emit("messages_added", { message: message });

        return res.status(200).json({ message: "" });
      }
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

    const { groupId, messageId, newContent } = req.body;

    if (!groupId || !messageId || !newContent) {
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

    const updated = await prisma.groupChats.update({
      where: {
        id: Number(messageId),
        groupId: Number(groupId),
      },
      data: {
        content: newContent,
        isEdited: true,
      },
    });

    io.to(`group_${groupId}`).emit("message_edited", {
      data: {
        messageId: updated.id,
        newContent: updated.content,
        isEdited: updated.isEdited,
      },
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

    if (groupAdmin.adminId === String(adminId)) {
      for (const messageId of messagesId) {
        await prisma.groupChats.delete({
          where: {
            id: Number(messageId),
          },
        });
      }

      io.to(`group_${groupId}`).emit("members_removed", {
        messages: messagesId,
      });
      return res.status(200).json({ message: "" });
    }

    return res.status(400).json({ message: "" });
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

    await prisma.groupChats.delete({
      where: {
        id: Number(messageId),
        groupId: Number(groupId),
      },
    });

    io.to(`group_${groupId}`).emit("message_deleted", { messageId: messageId });

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

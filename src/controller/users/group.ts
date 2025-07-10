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

    const add_group = await prisma.group.create({
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
        await prisma.groupChats.create({
          data: {
            senderId: String(memberId),
            content,
            groupId: Number(groupId),
          },
        });

        return res.status(200).json({ message: "" });
      }
    }

    return res.status(400).json({ message: "" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "" });
  }
}

export async function deleteMessageByAdmin(
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
    const memberId = req.cookies.userData.id;

    if (!memberId) {
      return res.status(400).json({ message: "" });
    }

    const id = req.params;

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

    return res.status(200).json({ message: "" });
  } catch (error) {
    return res.status(400).json({ message: "" });
  }
}

export async function deleteGroup(req: express.Request, res: express.Response) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const adminId = req.cookies.userData.id;

    if (!adminId) {
      return res.status(400).json({ message: "" });
    }

    const id = req.params;

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
    const groupId = req.params;

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
    const groupId = req.params;

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

    let members = {};
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
        members = { user };
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

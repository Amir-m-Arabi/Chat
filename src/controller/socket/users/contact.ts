import express from 'express'
import { body , validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { Server, Socket } from "socket.io";

const prisma = new PrismaClient()


export async function secrchByUsername(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const {username} = req.body

        if (!username){
            return res.status(400).json({message : ""})
        }

        const user = await prisma.user.findMany({
            where : {
                username
            },
            select:{
                id:true,
                username:true,
                profileURL:true
            }
        })

        if (!user){
            return res.status(400).json({message : ""})
        }

        return res.status(200).json({message : "" , data:user})

    }catch(error){
        console.log(error)
        return res.status(400).json({message : ""})
    }
}

export async function startContact(req: express.Request, res: express.Response):Promise<any> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const firstPersonID = req.cookies.userData?.id;
    const { secondPersonID, content } = req.body;

    if (!firstPersonID || !secondPersonID || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1. ایجاد Contact
    const makeContact = await prisma.contact.create({
      data: {
        firstPersonID,
        secondPersonID
      },
      select: { id: true }
    });

    // 2. ثبت اولین پیام
    await prisma.chatContent.create({
      data: {
        senderId: firstPersonID,
        content,
        chatId: makeContact.id
      }
    });

    // 3. ریترن به کلاینت
    return res.status(201).json({
      message: "Contact created",
      chatId: makeContact.id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}


import express from 'express'
import { body , validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


export async function createChannel(req:express.Request , res:express.Response):Promise<any>{

    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const userId = req.cookies.userData.id

        const {profileURL , channelName , description} = req.body

        if (!userId){
            return res.status(400).json({message : ""})
        }

        if (!profileURL || !channelName || !description){
            return res.status(400).json({message : ""})
        }

        const channel = await prisma.createChannel.create({
            data:{
                channelName,
                profileURL,
                description,
                userId
            }
        })


        if (!channel){
            return res.status(400).json({message : ""})
        }

        return res.status(200).json({message : ""})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function updateChannel(req:express.Request , res:express.Response):Promise<any>{

    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const userId = req.cookies.userData.id

        const id = req.params

        const {profileURL , channelName , description} = req.body

        if (!userId){
            return res.status(400).json({message : ""})
        }

        if (!profileURL || !channelName || !description){
            return res.status(400).json({message : ""})
        }

        const update_channel = await prisma.createChannel.update({
            where: {
                id : Number(id)
            },
            data:{
                channelName,
                profileURL,
                description,
                userId
            }
        })

        if (!update_channel){
            return res.status(400).json({message : ""})
        }

        return res.status(200).json({message : ""})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function deleteChannel(req:express.Request, res:express.Response):Promise<any>{
    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const id = req.params

        if (!id){
            return res.status(400).json({message: ""})
        }

        const remove = await prisma.createChannel.delete({
            where : {
                id : Number(id)
            }
        })

        if (!remove){
            return res.status(400).json({message : ""})
        }

        return res.status(200).json({message : ""})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function getChannel(req: express.Request, res: express.Response): Promise<any> {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Channel ID is required" });
    }

    const channel = await prisma.createChannel.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        followChannels: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // استخراج لیست کاربران
    const followers = channel.followChannels.map((follow:any) => follow.user);

    return res.status(200).json({
      message: "Channel fetched successfully",
      data: {
        channel,
        followers
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}


export async function getChannels(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const userId = req.cookies.userData.id

        if (!userId){
            return res.status(400).json({message : ""})
        }

        const allChannels = await prisma.createChannel.findMany({
            where:{
                userId
            },
            select:{
                id:true,
                channelName:true,
                profileURL:true,
                description:true
            }
        })

        if (!allChannels){
            return res.status(400).json({message : "" , data : allChannels})
        }

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}


// ========================= Follow Func ===================================

export async function addFollowChannel(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const userId = req.cookies.userData.id

        const channelId = req.params

        if (!userId){
            return res.status(400).json({message : ""})
        }

        if (!channelId){
            return res.status(400).json({message : ""})
        }

        const follow = await prisma.followChannels.create({
            data : {
                userId,
                channelId : Number(channelId),
            }
        })

        if (!follow){
            return res.status(400).json({message : ""})
        }

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function getFollowChannel(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const id = req.params

        if (!id){
            return res.status(400).json({message : ""})
        }

        const channel = await prisma.followChannels.findUnique({
            where:{
                id : Number(id)
            },
            select : {
                channelId : true
            }
        })

        if (!channel){
            return res.status(400).json({message : ""})
        }

        const get_channel = await prisma.createChannel.findUnique({
            where : {
                id : channel.channelId
            },
            select:{
                channelName:true,
                profileURL:true,
                description:true
            }
        })

        if (!get_channel){
            return res.status(400).json({message : ""})
        }

        return res.status(200).json({message : "" , data : get_channel})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function deleteFollow(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if (!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }

    try{

        const id = req.params

        if (!id){
            return res.status(400).json({message : ""})
        }

        const remove = await prisma.followChannels.delete({
            where : {
                id  : Number(id)
            }
        })

        if (!remove){
            return res.status(400).json({message : ""})
        }

        return res.status(200).json({message : ""})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}


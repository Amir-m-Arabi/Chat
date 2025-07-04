import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import {body , validationResult} from 'express-validator'


const prisma = new PrismaClient()

export async function signUp(req:express.Request , res:express.Response):Promise<any>{

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    try{

        const {username , password} = req.body

        if (!username || !password){
            return res.status(400).json({message:"username and password are required"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const admin = await prisma.admin.create({
            data:{
                username,
                password:hashedPassword,
            }
        })

        if (!admin){
            return res.status(400).json({message:"admin not created"})
        }

        return res.status(200).json({message: "Signup successful"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }   
}


export async function signIn(req:express.Request , res:express.Response):Promise<any>{

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    try{

        const {username , password} = req.body

        if (!username || !password){
            return res.status(400).json({message:"username and password are required"})
        }

        const admin = await prisma.admin.findUnique({
            where:{
                username,
            }
        })

        if (!admin){
            return res.status(400).json({message:"admin not found"})
        }

        const match = await bcrypt.compare(password, admin.password)

        if (!match){
            return res.status(400).json({message:"password is incorrect"})
        }

        const token = jwt.sign({id:admin.id , type:"ADMIN"}, process.env.JWT_SECRET as string, {expiresIn: '1d'})

        return res.status(200).json({message: "Login successful", token:token , admin:{id:admin.id , username:admin.username}})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function signOut(req:express.Request , res:express.Response):Promise<any>{

    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const id = req.params

        if (!id){
            return res.status(400).json({message:"id is required"})
        }

        const remove = await prisma.admin.delete({
            where:{
                id:Number(id)
            }
        })

        if (!remove){
            return res.status(400).json({message:"admin not deleted"})
        }

        return res.status(200).json({message: "Admin deleted successfully"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function updateAdmins(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const id = req.params

        const {username , password} = req.body

        if (!id){
            return res.status(400).json({message:"id is required"})
        }

        if (!username || !password){
            return res.status(400).json({message:"username and password are required"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const update = await prisma.admin.update({
            where:{
                id:Number(id)
            },
            data:{
                username,
                password:hashedPassword,
            }
        })

        if (!update){
            return res.status(400).json({message:"admin not updated"})
        }

        return res.status(200).json({message: "Admin updated successfully"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }

}

export async function getAdmin(req:express.Request , res:express.Response):Promise<any>{

    
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const adminId = req.admin.id

        if (!adminId){
            return res.status(400).json({message:"admin id is required"})
        }

        const admin = await prisma.admin.findUnique({
            where:{
                id:Number(adminId)
            }
        })

        if (!admin){
            return res.status(400).json({message:"admin not found"})
        }

        return res.status(200).json({message: "Admin found successfully", admin:{id:admin.id , username:admin.username}})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function getAdmins(req:express.Request , res:express.Response):Promise<any>{

    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const admins = await prisma.admin.findMany()

        if (!admins){
            return res.status(400).json({message:"admins not found"})
        }

        return res.status(200).json({message: "Admins found successfully", admins})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

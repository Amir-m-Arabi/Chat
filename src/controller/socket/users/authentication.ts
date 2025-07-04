import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import {body , validationResult} from 'express-validator'
import { sendVerificationCode } from '../../../helpers/entryCode'


const prisma = new PrismaClient()


export async function signIn(req:express.Request , res:express.Response):Promise<any>{

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    try{

        const {email = "" , username = "" , password} = req.body

        if (!password){
            return res.status(400).json({message:"password is required"})
        }

        const user = await prisma.user.findFirst({
            where:{
                OR:[
                    {
                        email,
                    },
                    {
                        username,
                    }
                ]
            },
        })

        if (!user){
            return res.status(400).json({message:"user not found"}) 
        }

        const match = await bcrypt.compare(password, user.password)

        if (!match){
            return res.status(400).json({message:"password is incorrect"})
        }

        const token = jwt.sign({id:user.id , type:"USER"}, process.env.JWT_SECRET as string, {expiresIn: '1d'})

        return res.status(200).json({message: "Login successful", token:token , user:{id:user.id , email:user.email , username:user.username}})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function signUp(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const {username , email , password} = req.body

        if (!username || !email || !password){
            return res.status(400).json({message:"username , email and password are required"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data:{
                username,
                email,
                password:hashedPassword,
            }
        })

        if (!user){
            return res.status(400).json({message:"user not created"})
        }

        const token = jwt.sign({id:user.id , type:"USER"}, process.env.JWT_SECRET as string, {expiresIn: '1d'})

        return res.status(200).json({message: "Signup successful", token:token , user:{id:user.id , email:user.email , username:user.username}})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function updateUser(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{
        const id = req.user.id
        const {username , email , password} = req.body

        if (!username || !email || !password){
            return res.status(400).json({message:"username , email and password are required"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const update_user = await prisma.user.update({
            where:{
                id:Number(id)
            },
            data:{
                username,
                email,
                password:hashedPassword,
            }
        })

        if (!update_user){
            return res.status(400).json({message:"user not updated"})
        }

        return res.status(200).json({message: "User updated successfully"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function deleteUser(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const id = req.user.id

        if (!id){
            return res.status(400).json({message:"id is required"})
        }

        const delete_user = await prisma.user.delete({
            where:{
                id:Number(id)
            }
        })

        if (!delete_user){
            return res.status(400).json({message:"user not deleted"})
        }

        return res.status(200).json({message: "User deleted successfully"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function getUserById(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const id = req.user.id

        if (!id){
            return res.status(400).json({message:"id is required"})
        }

        const user = await prisma.user.findFirst({
            where:{
                id:Number(id)
            }
        })

        if (!user){
            return res.status(400).json({message:"user not found"})
        }

        return res.status(200).json({message: "User found successfully", user:user})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}


export async function forgetPassword(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{
        const userId = req.user.id
        const {email} = req.body

        if (!email){
            return res.status(400).json({message:"email is required"})
        }

        const code = await sendVerificationCode(email)

        if (!code){
            return res.status(400).json({message:"code not sent"})
        }

        const sendCode = await prisma.entryCode.create({
            data:{
                code,
                userId
            }
        })

        if (!sendCode){
            return res.status(400).json({message:"code not sent"})
        }

        return res.status(200).json({message: "Code sent successfully"})
    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function verifyCode(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const userId = req.user.id
        const {code} = req.body

        if (!userId){
            return res.status(400).json({message:"userId are required"})
        }

        if (!code){
            return res.status(400).json({message:"code is required"})
        }

        const verifyCode = await prisma.entryCode.findFirst({
            where:{
                userId,
                code
            }
        })

        if (!verifyCode){
            return res.status(400).json({message:"code is incorrect"})
        }

        return res.status(200).json({message: "Code verified successfully"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}

export async function resetPassword(req:express.Request , res:express.Response):Promise<any>{
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({errors:error.array()})
    }

    try{

        const userId = req.user.id
        const {password} = req.body

        if (!userId){
            return res.status(400).json({message:"userId is required"})
        }

        if (!password){
            return res.status(400).json({message:"password is required"})
        }

        const reset = await prisma.user.update({
            where:{
                id:Number(userId)
            },
            data:{
                password
            }
        })

        if (!reset){
            return res.status(400).json({message:"password not reset"})
        }

        return res.status(200).json({message: "Password reset successfully"})

    }catch(error){
        console.log(error)
        return res.status(500).json({message:"something went wrong"})
    }
}
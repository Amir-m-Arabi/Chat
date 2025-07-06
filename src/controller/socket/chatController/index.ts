import { Server , Socket } from "socket.io";
import { chatHandlers } from "./chatHandlers";

export function registerSocketHandlers(io: Server , socket: Socket){
    chatHandlers(io , socket)
}
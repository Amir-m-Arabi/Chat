import { Server, Socket } from "socket.io";
import { chatHandlers } from "./chatHandlers";
import { groupChatHandlers } from "./groupChatHandlers";
import { channelHandlers } from "./channelHandler";

export function registerSocketHandlers(io: Server, socket: Socket) {
  chatHandlers(io, socket);
  groupChatHandlers(io, socket);
  channelHandlers(io, socket);
}

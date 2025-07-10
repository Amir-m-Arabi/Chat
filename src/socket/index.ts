import { Server, Socket } from "socket.io";
import { chatHandlers } from "./chatHandlers";
import { groupChatHandlers } from "./groupChatHandlers";

export function registerSocketHandlers(io: Server, socket: Socket) {
  chatHandlers(io, socket);
  groupChatHandlers(io, socket);
}

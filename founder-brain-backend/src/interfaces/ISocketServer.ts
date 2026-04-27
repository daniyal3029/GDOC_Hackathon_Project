export interface ISocketServer {
  emitToUser(userId: string, event: string, data: any): void;
  emitToRoom(roomId: string, event: string, data: any): void;
  getIO(): any;
}

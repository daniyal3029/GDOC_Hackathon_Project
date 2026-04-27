export interface IPresenceService {
  userJoinRoom(userId: string, socketId: string, roomId: string): Promise<void>;
  userLeaveRoom(userId: string, socketId: string, roomId: string): Promise<void>;
  getUsersInRoom(roomId: string): Promise<string[]>;
  getUserRooms(userId: string): Promise<string[]>;
  disconnectUser(userId: string, socketId: string): Promise<void>;
  heartbeat(userId: string, socketId: string): Promise<void>;
}

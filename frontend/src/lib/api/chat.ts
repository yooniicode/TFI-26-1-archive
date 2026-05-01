import { get, post, put } from './client'
import { schemas } from '../schemas'

export const chatApi = {
  rooms: () =>
    get('/chat/rooms', schemas.chatRooms),

  roomWithInterpreter: (interpreterId: string) =>
    post(`/chat/rooms/with-interpreter/${interpreterId}`, undefined, schemas.chatRoom),

  roomWithPatient: (patientId: string) =>
    post(`/chat/rooms/with-patient/${patientId}`, undefined, schemas.chatRoom),

  messages: (roomId: string, page = 0) =>
    get(`/chat/rooms/${roomId}/messages?page=${page}&size=50&sort=createdAt,asc`, schemas.chatMessages),

  send: (roomId: string, content: string) =>
    post(`/chat/rooms/${roomId}/messages`, { content }, schemas.chatMessage),

  markRead: (roomId: string) =>
    put<void>(`/chat/rooms/${roomId}/read`, undefined),

  unreadCount: () =>
    get('/chat/unread-count', schemas.chatUnreadCount),
}

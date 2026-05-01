package com.byby.backend.domain.chat.dto;

import com.byby.backend.domain.chat.entity.ChatMessage;
import com.byby.backend.domain.chat.entity.ChatRoom;
import com.byby.backend.domain.chat.entity.ChatRoomMember;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ChatResponse {

    public record RoomSummary(
            UUID id,
            String name,
            String lastMessage,
            LocalDateTime lastMessageAt,
            String lastMessageSenderName,
            int unreadCount,
            List<MemberInfo> members
    ) {
        public static RoomSummary from(ChatRoom room, List<ChatRoomMember> members,
                                       ChatMessage lastMsg, int unread, UUID myAuthUserId) {
            String otherNames = members.stream()
                    .filter(m -> !m.getAuthUserId().equals(myAuthUserId))
                    .map(m -> m.getMemberName() != null ? m.getMemberName() : "")
                    .filter(n -> !n.isBlank())
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            String roomName = otherNames.isBlank() ? room.getName() : otherNames;
            return new RoomSummary(
                    room.getId(),
                    roomName,
                    lastMsg != null ? lastMsg.getContent() : null,
                    lastMsg != null ? lastMsg.getCreatedAt() : null,
                    lastMsg != null ? lastMsg.getSenderName() : null,
                    unread,
                    members.stream().map(MemberInfo::from).toList()
            );
        }
    }

    public record MemberInfo(
            UUID authUserId,
            String memberName,
            String role,
            LocalDateTime lastReadAt
    ) {
        public static MemberInfo from(ChatRoomMember m) {
            return new MemberInfo(m.getAuthUserId(), m.getMemberName(), m.getRole(), m.getLastReadAt());
        }
    }

    public record Message(
            UUID id,
            UUID roomId,
            UUID senderAuthUserId,
            String senderName,
            String content,
            LocalDateTime createdAt
    ) {
        public static Message from(ChatMessage m) {
            return new Message(
                    m.getId(),
                    m.getRoom().getId(),
                    m.getSenderAuthUserId(),
                    m.getSenderName(),
                    m.getContent(),
                    m.getCreatedAt()
            );
        }
    }

    public record UnreadCount(int total) {}
}

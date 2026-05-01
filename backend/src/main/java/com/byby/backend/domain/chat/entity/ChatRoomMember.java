package com.byby.backend.domain.chat.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_room_member")
@IdClass(ChatRoomMemberId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoomMember {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @Id
    @Column(name = "auth_user_id", nullable = false)
    private UUID authUserId;

    @Column(name = "member_name", length = 100)
    private String memberName;

    @Column(name = "role", length = 20, nullable = false)
    private String role;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    @Builder
    public ChatRoomMember(ChatRoom room, UUID authUserId, String memberName, String role) {
        this.room = room;
        this.authUserId = authUserId;
        this.memberName = memberName;
        this.role = role;
        this.lastReadAt = LocalDateTime.now();
    }

    public void updateLastRead() {
        this.lastReadAt = LocalDateTime.now();
    }

    public void updateLastRead(LocalDateTime readAt) {
        if (readAt == null) {
            updateLastRead();
            return;
        }
        if (this.lastReadAt == null || readAt.isAfter(this.lastReadAt)) {
            this.lastReadAt = readAt;
        }
    }
}

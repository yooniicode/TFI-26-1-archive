package com.byby.backend.domain.chat.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_message")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @Column(name = "sender_auth_user_id", nullable = false)
    private UUID senderAuthUserId;

    @Column(name = "sender_name", length = 100)
    private String senderName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public ChatMessage(ChatRoom room, UUID senderAuthUserId, String senderName, String content) {
        this.room = room;
        this.senderAuthUserId = senderAuthUserId;
        this.senderName = senderName;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }
}

package com.byby.backend.domain.chat.repository;

import com.byby.backend.domain.chat.entity.ChatMessage;
import com.byby.backend.domain.chat.entity.ChatRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByRoomOrderByCreatedAtAsc(ChatRoom room, Pageable pageable);

    Optional<ChatMessage> findTopByRoomOrderByCreatedAtDesc(ChatRoom room);

    @Query("""
        SELECT COUNT(m)
        FROM ChatMessage m
        WHERE m.room = :room
          AND m.createdAt > :after
          AND m.senderAuthUserId <> :authUserId
        """)
    int countUnreadByRoom(
            @Param("room") ChatRoom room,
            @Param("after") LocalDateTime after,
            @Param("authUserId") UUID authUserId);
}

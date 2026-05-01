package com.byby.backend.domain.chat.repository;

import com.byby.backend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Query("""
        SELECT r FROM ChatRoom r
        WHERE EXISTS (SELECT 1 FROM ChatRoomMember m1 WHERE m1.room = r AND m1.authUserId = :u1)
          AND EXISTS (SELECT 1 FROM ChatRoomMember m2 WHERE m2.room = r AND m2.authUserId = :u2)
          AND (SELECT COUNT(m) FROM ChatRoomMember m WHERE m.room = r) = 2
        """)
    Optional<ChatRoom> findDirectRoom(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("""
        SELECT r FROM ChatRoom r
        WHERE EXISTS (SELECT 1 FROM ChatRoomMember m WHERE m.room = r AND m.authUserId = :authUserId)
        ORDER BY r.updatedAt DESC
        """)
    List<ChatRoom> findRoomsByMember(@Param("authUserId") UUID authUserId);
}

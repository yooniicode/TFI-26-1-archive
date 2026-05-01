package com.byby.backend.domain.chat.repository;

import com.byby.backend.domain.chat.entity.ChatRoom;
import com.byby.backend.domain.chat.entity.ChatRoomMember;
import com.byby.backend.domain.chat.entity.ChatRoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, ChatRoomMemberId> {

    List<ChatRoomMember> findByRoom(ChatRoom room);

    Optional<ChatRoomMember> findByRoomAndAuthUserId(ChatRoom room, UUID authUserId);
}

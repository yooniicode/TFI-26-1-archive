package com.byby.backend.domain.chat.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomMemberId implements Serializable {
    private UUID room;
    private UUID authUserId;
}

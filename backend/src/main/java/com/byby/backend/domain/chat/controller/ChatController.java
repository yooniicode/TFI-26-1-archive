package com.byby.backend.domain.chat.controller;

import com.byby.backend.common.response.Response;
import com.byby.backend.common.response.code.SuccessCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.chat.dto.ChatRequest;
import com.byby.backend.domain.chat.dto.ChatResponse;
import com.byby.backend.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /** 내 채팅방 목록 */
    @GetMapping("/rooms")
    public ResponseEntity<Response<List<ChatResponse.RoomSummary>>> getRooms(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Response.success(SuccessCode.OK, chatService.getRooms(principal)));
    }

    /** 통번역가와 채팅방 생성/조회 (센터 직원 → 통번역가, 이주민 → 통번역가) */
    @PostMapping("/rooms/with-interpreter/{interpreterId}")
    public ResponseEntity<Response<ChatResponse.RoomSummary>> roomWithInterpreter(
            @PathVariable UUID interpreterId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ChatResponse.RoomSummary room = principal.isPatient()
                ? chatService.getOrCreateRoomWithPatientInterpreter(interpreterId, principal)
                : chatService.getOrCreateRoomWithInterpreter(interpreterId, principal);
        return ResponseEntity.ok(Response.success(SuccessCode.OK, room));
    }

    /** 이주민과 채팅방 생성/조회 (통번역가 → 이주민) */
    @PostMapping("/rooms/with-patient/{patientId}")
    public ResponseEntity<Response<ChatResponse.RoomSummary>> roomWithPatient(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Response.success(SuccessCode.OK,
                chatService.getOrCreateRoomWithMatchedPatient(patientId, principal)));
    }

    /** 메시지 목록 (오래된 순, 페이징) */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Response<List<ChatResponse.Message>>> getMessages(
            @PathVariable UUID roomId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Response.success(SuccessCode.OK,
                chatService.getMessages(roomId, pageable, principal)));
    }

    /** 메시지 전송 */
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Response<ChatResponse.Message>> sendMessage(
            @PathVariable UUID roomId,
            @Valid @RequestBody ChatRequest.SendMessage req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(201).body(Response.success(SuccessCode.CREATED,
                chatService.sendMessage(roomId, req.content(), principal)));
    }

    /** 읽음 처리 */
    @PutMapping("/rooms/{roomId}/read")
    public ResponseEntity<Response<Void>> markRead(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal UserPrincipal principal) {
        chatService.markRead(roomId, principal);
        return ResponseEntity.ok(Response.success(SuccessCode.OK));
    }

    /** 전체 미읽음 수 */
    @GetMapping("/unread-count")
    public ResponseEntity<Response<ChatResponse.UnreadCount>> unreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Response.success(SuccessCode.OK,
                chatService.getUnreadCount(principal)));
    }
}

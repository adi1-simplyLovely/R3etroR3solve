package com.helpdesk.chat;

import com.helpdesk.auth.security.UserPrincipal;
import com.helpdesk.chat.dto.ChatMessage;
import com.helpdesk.chat.dto.OnlineUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final PresenceEventListener presenceEventListener;

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
            chatMessage.setSenderName(user.getName() + " [" + user.getEmail() + "]");
            chatMessage.setSenderRole(user.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""));
        } else {
            chatMessage.setSenderName("Anonymous");
            chatMessage.setSenderRole("USER");
        }
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setType(ChatMessage.MessageType.CHAT);

        // Persist to database
        ChatEntity entity = new ChatEntity(null, chatMessage.getSenderName(), chatMessage.getSenderRole(), chatMessage.getContent(), chatMessage.getTimestamp(), chatMessage.getType().name());
        chatRepository.save(entity);

        return chatMessage;
    }

    @MessageMapping("/chat.typing")
    @SendTo("/topic/typing")
    public TypingNotification typingNotification(Authentication authentication) {
        String senderName = "Anonymous";
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
            senderName = user.getName();
        }
        return new TypingNotification(senderName);
    }

    public static class TypingNotification {
        private String username;
        public TypingNotification() {}
        public TypingNotification(String username) { this.username = username; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    // Handles the initial connection sync for online users (STOMP subscribe mapping is often intercepted by broker, so we provide an HTTP endpoint too)
    @GetMapping("/online-users")
    public ResponseEntity<Collection<OnlineUser>> getOnlineUsers() {
        return ResponseEntity.ok(presenceEventListener.getActiveUsers());
    }

    // HTTP Endpoint to fetch history
    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory() {
        List<ChatEntity> entities = chatRepository.findTop50ByOrderByTimestampDesc();
        // Reverse so chronological
        Collections.reverse(entities);

        List<ChatMessage> history = entities.stream().map(e -> {
            ChatMessage msg = new ChatMessage();
            msg.setSenderName(e.getSenderName());
            msg.setSenderRole(e.getSenderRole());
            msg.setContent(e.getContent());
            msg.setTimestamp(e.getTimestamp());
            msg.setType(ChatMessage.MessageType.valueOf(e.getType()));
            return msg;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    // HTTP Endpoint to clear history (ADMIN only)
    @DeleteMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> clearChatHistory() {
        chatRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}


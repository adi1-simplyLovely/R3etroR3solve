package com.helpdesk.chat;

import com.helpdesk.auth.security.UserPrincipal;
import com.helpdesk.chat.dto.OnlineUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    // Maps sessionId to OnlineUser
    private final Map<String, OnlineUser> activeSessions = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) accessor.getUser();
            if (auth.getPrincipal() instanceof UserPrincipal) {
                UserPrincipal user = (UserPrincipal) auth.getPrincipal();
                String role = user.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
                OnlineUser onlineUser = new OnlineUser(user.getName(), role);
                activeSessions.put(accessor.getSessionId(), onlineUser);
                
                broadcastOnlineUsers();
                log.info("User connected: " + user.getName());
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        
        if (sessionId != null && activeSessions.containsKey(sessionId)) {
            OnlineUser user = activeSessions.remove(sessionId);
            broadcastOnlineUsers();
            log.info("User disconnected: " + user.getName());
        }
    }

    private void broadcastOnlineUsers() {
        Collection<OnlineUser> users = activeSessions.values();
        messagingTemplate.convertAndSend("/topic/online-users", users);
    }

    public Collection<OnlineUser> getActiveUsers() {
        return activeSessions.values();
    }
}

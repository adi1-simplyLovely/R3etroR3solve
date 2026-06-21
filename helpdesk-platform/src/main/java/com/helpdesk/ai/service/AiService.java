package com.helpdesk.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${helpdesk.ai.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    public String generateDraftReply(String ticketTitle, String ticketDescription, String pastComments, String userName, String userRole) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("not-set")) {
            return "Error: AI API Key is missing on the server. Please add it to application.properties.";
        }

        String systemPrompt = "You are a professional, empathetic IT Helpdesk Support Agent. " +
                "Your job is to draft a response to the user based on their ticket. " +
                "Keep it concise, polite, and directly address their issue. Your name is " + userName + ", and your role is " + userRole + ". Sign off the draft with your name.";
        
        String userPrompt = String.format("Ticket Title: %s\nTicket Description: %s\nPast Comments: %s\n\nPlease draft a reply for me to send.", 
                ticketTitle, ticketDescription, pastComments);

        return callGroqApi(systemPrompt, userPrompt);
    }

    public String getCopilotResponse(String userMessage, String contextData, String userName, String userRole) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("not-set")) {
            return "It looks like my AI brain is disconnected! Please provide an AI API key to the server.";
        }

        String systemPrompt = "You are 'Clippy', an interactive AI Copilot inside a retro Windows 95 style Helpdesk platform. " +
                "You assist the user you are talking to. The user's name is " + userName + " and their role is " + userRole + ". Address them by their name occasionally. " +
                "You are slightly enthusiastic, very helpful, and occasionally use IT humor. " +
                "You have access to the following context about the ticket they are currently viewing:\n" +
                contextData;

        return callGroqApi(systemPrompt, userMessage);
    }

    public String routeTicket(String title, String description) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("not-set")) {
            return "{\"category\":\"OTHER_GENERAL\",\"priority\":\"LOW\"}";
        }
        String systemPrompt = "You are an automated ticket router. Based on the user's title and description, assign the most appropriate Category and Priority. " +
                "Respond ONLY with a valid JSON object containing 'category' and 'priority' keys. Do not include markdown formatting or extra text.\n" +
                "Valid Categories: IT_HARDWARE, IT_SOFTWARE, IT_NETWORK, IT_ACCESS, HR_PAYROLL, HR_BENEFITS, FINANCE_EXPENSES, FACILITIES_MAINTENANCE, OTHER_GENERAL\n" +
                "Valid Priorities: LOW, MEDIUM, HIGH, URGENT";
        String userMessage = "Title: " + title + "\nDescription: " + description;
        return callGroqApi(systemPrompt, userMessage, true); // Use JSON mode if possible, but Groq Llama 3 handles prompt well
    }

    public String deflectTicket(String title, String description) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("not-set")) return "";
        
        String systemPrompt = "You are an AI Ticket Deflector. Read the user's issue. If it is a common issue (e.g. password reset, printer jam, clear cache), provide a very brief 1-2 sentence quick-fix guide. " +
                "If the issue is complex and requires human intervention, reply EXACTLY with 'NO_DEFLECTION'.";
        String userMessage = "Title: " + title + "\nDescription: " + description;
        String response = callGroqApi(systemPrompt, userMessage);
        return response.contains("NO_DEFLECTION") ? "" : response;
    }

    private String callGroqApi(String systemPrompt, String userMessage) {
        return callGroqApi(systemPrompt, userMessage, false);
    }

    private String callGroqApi(String systemPrompt, String userMessage, boolean jsonMode) {
        int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++) {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", "llama-3.1-8b-instant");
                
                requestBody.put("messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ));

                if (jsonMode) {
                    requestBody.put("response_format", Map.of("type", "json_object"));
                }

                String jsonBody = objectMapper.writeValueAsString(requestBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GROQ_URL))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .timeout(Duration.ofSeconds(30))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode rootNode = objectMapper.readTree(response.body());
                    return rootNode.path("choices").get(0).path("message").path("content").asText();
                } else if (response.statusCode() == 429 || response.statusCode() >= 500) {
                    // Transient error, sleep and retry
                    if (i < maxRetries - 1) {
                        Thread.sleep(1000 * (i + 1));
                        continue;
                    }
                    return "AI Error: " + response.statusCode() + " - " + response.body();
                } else {
                    return "AI Error: " + response.statusCode() + " - " + response.body();
                }
            } catch (Exception e) {
                // Connection reset or timeout
                if (i < maxRetries - 1) {
                    try { Thread.sleep(1000 * (i + 1)); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    continue;
                }
                e.printStackTrace();
                return "Failed to communicate with AI service: " + e.getMessage();
            }
        }
        return "Failed to communicate with AI service.";
    }
}

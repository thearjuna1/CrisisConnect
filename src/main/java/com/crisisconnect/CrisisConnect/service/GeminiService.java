package com.crisisconnect.CrisisConnect.service;

import com.crisisconnect.CrisisConnect.dto.AiAnalysisResult;
import com.crisisconnect.CrisisConnect.enums.Category;
import com.crisisconnect.CrisisConnect.enums.Priority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Slf4j
@Service
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AiAnalysisResult analyzeIncident(String title, String description) {
        try {
            String prompt = buildPrompt(title, description);

            Map<String, Object> requestBody = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{ Map.of("text", prompt) })
                    }
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = apiUrl + "?key=" + apiKey;

            String rawResponse = restTemplate.postForObject(url, entity, String.class);

            return parseGeminiResponse(rawResponse);

        } catch (Exception e) {
            log.error("Gemini AI analysis failed, falling back to defaults", e);
            return fallbackResult();
        }
    }

    private String buildPrompt(String title, String description) {
        return """
                You are a disaster/hazard triage assistant. Analyze this incident report and respond with ONLY a raw JSON object, no markdown, no code fences, no explanation.

                Title: %s
                Description: %s

                Return JSON in exactly this shape:
                {
                  "category": "one of FLOOD, LANDSLIDE, FOREST_FIRE, POTHOLE, BROKEN_STREET_LIGHT, FALLEN_TREE, BUILDING_DAMAGE",
                  "priority": "one of LOW, MEDIUM, HIGH",
                  "summary": "a short 1-2 sentence neutral summary of the incident",
                  "safetyAdvice": "2-3 sentences of practical safety advice for nearby residents"
                }
                """.formatted(title, description);
    }

    private AiAnalysisResult parseGeminiResponse(String rawResponse) throws Exception {
        JsonNode root = objectMapper.readTree(rawResponse);

        String text = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();

        String cleanJson = text.trim()
                .replaceAll("^```json", "")
                .replaceAll("^```", "")
                .replaceAll("```$", "")
                .trim();

        JsonNode parsed = objectMapper.readTree(cleanJson);

        Category category = parseEnumSafe(Category.class, parsed.path("category").asText(), Category.BUILDING_DAMAGE);
        Priority priority = parseEnumSafe(Priority.class, parsed.path("priority").asText(), Priority.MEDIUM);
        String summary = parsed.path("summary").asText("Summary unavailable.");
        String safetyAdvice = parsed.path("safetyAdvice").asText("Please stay cautious and avoid the affected area.");

        return new AiAnalysisResult(category, priority, summary, safetyAdvice);
    }

    private <T extends Enum<T>> T parseEnumSafe(Class<T> enumClass, String value, T fallback) {
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (Exception e) {
            return fallback;
        }
    }

    private AiAnalysisResult fallbackResult() {
        return new AiAnalysisResult(
                Category.BUILDING_DAMAGE,
                Priority.MEDIUM,
                "AI analysis unavailable. Manual review required.",
                "Please exercise caution near the reported location until verified."
        );
    }

}
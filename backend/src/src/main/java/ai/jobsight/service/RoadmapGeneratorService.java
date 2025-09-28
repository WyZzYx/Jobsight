package ai.jobsight.service;

import ai.jobsight.dto.PreciseRoadmapRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class RoadmapGeneratorService {

    private final RestTemplate llm; // plain RestTemplate
    private final String model;

    public RoadmapGeneratorService(
            @Qualifier("llmTemplate") RestTemplate llm,
            @Value("${ollama.model:llama3.2:3b}") String model
    ) {
        this.llm = llm;
        this.model = model;
    }

    public Map<String, Object> buildPrecisePlan(PreciseRoadmapRequest req) {
        String prompt = """
    You are an expert career coach. Build a concise month-by-month learning ROADMAP only in plain text (no Markdown).

    INPUT
    - Target role: %s
    - Current skills (comma-separated, may be empty): %s
    - Timeline (months): %s
    - Country (for examples/resources): %s

    GUIDELINES
    - Assume beginner if skills are empty; otherwise tailor to listed skills.
    - Keep total months = %s.
    - Emphasize practical learning and a project every month.
    - Keep language compact. 5–8 short bullets per month max.
    - Include 1–3 reputable resources per month (free if possible, add URLs).
    - Use local context when relevant (%s), but keep resources broadly accessible.

    FORMAT (exactly this structure in plain text, no extra prose before/after)
    Title: %s Roadmap (%s months)

    Prerequisites:
    - (up to 5 bullets tailored to the user)

    Month 1 — THEME
    - Skills: a, b, c
    - Study: 2–3 bullets
    - Project: one-line title + 2–3 bullet outline
    - Resources: name — URL; name — URL
    - Time split: ~X%% theory / Y%% practice

    Month 2 — THEME
    - Skills: ...
    - Study: ...
    - Project: ...
    - Resources: ...
    - Time split: ...

    ... (continue up to Month %s)

    Capstone:
    - One-line title
    - 3–5 bullet outline
    - Deliverables: 2–3 bullets

    Interview & Job Search (final 2–4 weeks):
    - 4–6 bullets (portfolio, applications, networking, mock interviews)

    Metrics to Track:
    - 4–6 bullets (e.g., weekly hours, #projects, #applications, etc.)

    Next Steps after %s:
    - 3–5 bullets (advancement paths, specialization ideas)
    
    Return ONLY valid minified JSON.
    """.formatted(
                nz(req.getTargetRole()),
                nz(req.getCurrentSkills()),
                nz(req.getTimelineMonths()),
                nz(req.getCountry()),
                nz(req.getTimelineMonths()),
                nz(req.getCountry()),
                nz(req.getTargetRole()),
                nz(req.getTimelineMonths()),
                nz(req.getTimelineMonths()),
                nz(req.getTimelineMonths())
        );


        Map<String, Object> payload = new HashMap<>();

        payload.put("model", model);
        payload.put("prompt", prompt);
        payload.put("stream", false);

        payload.put("options", Map.of(
                "num_predict", 500,
                "temperature", 0.4,
                "repeat_penalty", 1.1
        ));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = llm.postForObject("/api/generate", payload, Map.class);
            String text = String.valueOf(resp == null ? "" : resp.getOrDefault("response", ""));

            Map<String, Object> out = new HashMap<>();
            out.put("model", model);
            out.put("plan", text);
            return out;

        } catch (Exception e) {
            log.error("Ollama call failed (model={})", model, e);
            throw new RuntimeException("Failed (model=" + model + "): " + e.getMessage(), e);
        }
    }


    private static String nz(Object v) { return v == null ? "-" : String.valueOf(v); }
}

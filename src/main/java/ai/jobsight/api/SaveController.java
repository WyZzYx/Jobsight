// src/main/java/ai/jobsight/api/SaveController.java
package ai.jobsight.api;

import ai.jobsight.repo.*;
import ai.jobsight.save.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved")
@RequiredArgsConstructor
public class SaveController {

    private final SavedSearchRepo searches;
    private final SavedCompareRepo compares;
    private final SavedQuizResultRepo quizzes;
    private final SavedRoadmapRepo roadmaps;
    private final ObjectMapper mapper = new ObjectMapper();

    private Long uid(Authentication a){ return (Long)a.getPrincipal(); }


    // --- Searches ---
    @PostMapping("/searches")
    public ResponseEntity<?> saveSearch(@AuthenticationPrincipal Long userId,
                                        @RequestBody SavedSearch s) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        s.setId(null);
        s.setUserId(userId);
        s.setCreatedAt(Instant.now());
        var saved = searches.save(s);
        return ResponseEntity.created(URI.create("/api/saved/searches/" + saved.getId()))
                .body(saved);
    }

    @GetMapping("/searches")
    public List<SavedSearch> mySearches(@AuthenticationPrincipal Long userId) {
        return searches.findByUserId(userId);
    }

    @DeleteMapping("/searches/{id}")
    public ResponseEntity<?> delSearch(@PathVariable Long id,
                                       @AuthenticationPrincipal Long userId) {
        searches.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .ifPresent(searches::delete);
        return ResponseEntity.noContent().build();
    }

    // --- Compares ---
    @PostMapping("/compares")
    public ResponseEntity<?> saveCompare(@AuthenticationPrincipal Long userId,
                                         @RequestBody SavedCompare c) {
        if (userId == null) return ResponseEntity.status(401).build();
        c.setId(null);
        c.setUserId(userId);
        c.setCreatedAt(Instant.now());
        var saved = compares.save(c);
        return ResponseEntity.created(URI.create("/api/saved/compares/" + saved.getId()))
                .body(saved);
    }

    @GetMapping("/compares")
    public List<SavedCompare> myCompares(@AuthenticationPrincipal Long userId) {
        return compares.findByUserId(userId);
    }

    @DeleteMapping("/compares/{id}")
    public ResponseEntity<?> delCompare(@PathVariable Long id,
                                        @AuthenticationPrincipal Long userId) {
        compares.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .ifPresent(compares::delete);
        return ResponseEntity.noContent().build();
    }

    // --- Quiz results ---
    @PostMapping("/quiz")
    public ResponseEntity<?> saveQuiz(@AuthenticationPrincipal Long userId,
                                      @RequestBody SavedQuizResult q) {
        if (userId == null) return ResponseEntity.status(401).build();
        q.setId(null);
        q.setUserId(userId);
        q.setCreatedAt(Instant.now());
        var saved = quizzes.save(q);
        return ResponseEntity.created(URI.create("/api/saved/quiz/" + saved.getId()))
                .body(saved);
    }

    @GetMapping("/quiz")
    public List<SavedQuizResult> myQuiz(@AuthenticationPrincipal Long userId) {
        return quizzes.findByUserId(userId);
    }

    // Roadmaps
    @PostMapping("/roadmaps")
    public SavedRoadmap saveRoadmap(@RequestBody Map<String, Object> body, Authentication a) {
        var r = new SavedRoadmap();
        r.setId(null);
        r.setUserId(uid(a));
        r.setCreatedAt(Instant.now());
        r.setTitle((String) body.getOrDefault("title", "Roadmap"));
        r.setSource((String) body.getOrDefault("source", "manual"));

        // planText is plain text
        r.setPlanText((String) body.get("planText"));

        // plan can be an object or a JSON string
        Object plan = body.get("plan");
        if (plan instanceof Map<?, ?> m) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cast = (Map<String, Object>) m;
            r.setPlanJson(cast);
        } else if (plan instanceof String s && !s.isBlank()) {
            try {
                Map<String, Object> parsed = mapper.readValue(s, new TypeReference<>() {});
                r.setPlanJson(parsed);
            } catch (Exception ignored) {
                // If it’s not valid JSON, leave planJson null; planText still persisted
            }
        }
        return roadmaps.save(r);
    }

    @GetMapping("/roadmaps")
    public List<SavedRoadmap> myRoadmaps(Authentication a){
        return roadmaps.findByUserId(uid(a));
    }

    @DeleteMapping("/roadmaps/{id}")
    public ResponseEntity<?> delRoadmap(@PathVariable Long id, Authentication a) {
        roadmaps.findById(id).filter(x -> x.getUserId().equals(uid(a))).ifPresent(roadmaps::delete);
        return ResponseEntity.noContent().build();
    }

}

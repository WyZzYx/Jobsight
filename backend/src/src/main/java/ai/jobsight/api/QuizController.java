package ai.jobsight.api;

import ai.jobsight.service.RoadmapTemplates;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/quiz")
public class QuizController {

    @Data public static class QuizRequest {
        private List<String> selections;
    }
    @Data public static class QuizResult {
        private String roleId;
        private String roleTitle;
        private Map<String,Integer> score;
        private RoadmapTemplates.RoleTemplate template;
    }

    private final RoadmapTemplates templates;

    @PostMapping("/evaluate")
    public QuizResult evaluate(@RequestBody QuizRequest req) {
        var tally = new HashMap<String,Integer>();
        for (var pick : req.getSelections()) {
            tally.merge(pick, 1, Integer::sum);
        }
        var best = tally.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("java-backend");

        var tpl = templates.byId(best).orElse(templates.all().get(0));
        var res = new QuizResult();
        res.setRoleId(tpl.getId());
        res.setRoleTitle(tpl.getTitle());
        res.setScore(tally);
        res.setTemplate(tpl);
        return res;
    }
}

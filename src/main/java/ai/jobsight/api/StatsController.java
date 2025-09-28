package ai.jobsight.api;

import ai.jobsight.dto.SkillStatDTO;
import ai.jobsight.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {
    private final StatsService stats;

    @GetMapping("/skills")
    public List<SkillStatDTO> topSkills(@RequestParam(required = false) String title,
                                        @RequestParam(required = false) String location,
                                        @RequestParam(defaultValue = "15") int limit) {
        return stats.topSkills(title, location, limit);
    }
}

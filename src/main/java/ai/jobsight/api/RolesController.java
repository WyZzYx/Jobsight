package ai.jobsight.api;

import ai.jobsight.service.RoadmapTemplates;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/roles")
public class RolesController {
    private final RoadmapTemplates templates;

    @GetMapping
    public List<RoadmapTemplates.RoleTemplate> list() {
        return templates.all();
    }
}

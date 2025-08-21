package ai.jobsight.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoadmapService {
    public record Roadmap(
            RoadmapTemplates.RoleTemplate role,
            List<String> present,
            List<String> missing,
            List<Learning> learning,
            List<RoadmapTemplates.Project> projects
    ) {}
    public record Learning(String title, String tip, String type) {}

    private final RoadmapTemplates templates;

    public Roadmap buildFromSkills(List<String> skills, String roleId) {
        var role = templates.byId(roleId).orElseGet(() -> templates.all().get(0));
        var have = skills == null ? Set.<String>of() :
                skills.stream().map(s -> s.toLowerCase().trim()).collect(Collectors.toSet());

        var present = role.getTargetSkills().stream()
                .filter(s -> have.contains(s.toLowerCase())).toList();

        var missing = role.getTargetSkills().stream()
                .filter(s -> !have.contains(s.toLowerCase())).toList();

        var learning = new ArrayList<Learning>();
        for (var m : missing) {
            learning.add(new Learning("Learn " + m,
                    "Take a focused tutorial and implement 1 mini-demo using " + m + ".", "skill"));
        }
        learning.add(new Learning("Weekly rhythm",
                "3 study sessions, 1 project session, 1 retrospective.", "habit"));

        return new Roadmap(role, present, missing, learning, role.getProjects());
    }
}

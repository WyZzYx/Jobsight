package ai.jobsight.service;

import lombok.*;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class RoadmapTemplates {

    @Getter @AllArgsConstructor
    public static class RoleTemplate {
        private String id;
        private String title;
        private List<String> targetSkills;
        private List<Project> projects;
    }
    @Getter @AllArgsConstructor
    public static class Project {
        private String title;
        private String desc;
    }

    private final List<RoleTemplate> roles = List.of(
            new RoleTemplate(
                    "java-backend", "Java Backend Engineer",
                    List.of("java","spring","spring boot","rest","postgresql","docker","ci/cd","hibernate"),
                    List.of(
                            new Project("Job Board API","CRUD + filtering, JWT auth, Postgres, Docker compose"),
                            new Project("Resume Analyzer Service","FastAPI + Java gateway, file uploads, rate limiting"),
                            new Project("CI/CD Pipeline","GitHub Actions build/test, push images, deploy with compose")
                    )
            ),
            new RoleTemplate(
                    "react-frontend","React Frontend Developer",
                    List.of("javascript","react","vite","tailwind","rest","testing"),
                    List.of(
                            new Project("JobSight UI","Dashboard, results, charts, API integration"),
                            new Project("Design System","Buttons, inputs, cards as a reusable lib"),
                            new Project("E2E Tests","Playwright basic flows")
                    )
            ),
            new RoleTemplate(
                    "devops","DevOps Engineer",
                    List.of("linux","bash","docker","k8s","terraform","ci/cd","monitoring"),
                    List.of(
                            new Project("Observability Stack","Prometheus + Grafana for JobSight"),
                            new Project("K8s Manifests","Deploy backend + analyzer + ingress"),
                            new Project("Infra as Code","Terraform VPC + DB module")
                    )
            ),
            new RoleTemplate(
                    "data-analyst","Data Analyst",
                    List.of("sql","excel","python","pandas","visualization"),
                    List.of(
                            new Project("Salary Insights","Scrape salaries, clean in pandas, publish a report"),
                            new Project("Skill Trends","Analyze skill frequency over time"),
                            new Project("Interactive Dashboard","Streamlit app with filters")
                    )
            )
    );

    public List<RoleTemplate> all() { return roles; }
    public Optional<RoleTemplate> byId(String id) {
        return roles.stream().filter(r -> r.getId().equals(id)).findFirst();
    }
}

package ai.jobsight.providers.adzuna;

import ai.jobsight.domain.JobPosting;
import ai.jobsight.domain.SalaryRange;
import ai.jobsight.domain.enums.JobSource;
import ai.jobsight.domain.enums.Seniority;
import ai.jobsight.domain.enums.WorkType;
import ai.jobsight.domain.query.JobSearchQuery;
import ai.jobsight.providers.JobProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdzunaProvider implements JobProvider {

    private final AdzunaClient client;
    private final ObjectMapper om = new ObjectMapper();

    @Value("${providers.adzuna.enabled:true}")
    private boolean enabled;

    @Override public String name() { return JobSource.ADZUNA.name(); }
    @Override public boolean enabled() { return enabled; }

    @Override
    @Retry(name = "adzuna")
    @CircuitBreaker(name = "adzuna")
    public List<JobPosting> search(JobSearchQuery q) throws Exception {
        String json = client.search(
                q.title() == null ? "" : q.title(),
                q.location() == null ? "" : q.location(),
                q.page() == null ? 0 : q.page(),
                q.size() == null ? 20 : q.size()
        );

        JsonNode root = om.readTree(json);
        JsonNode results = root.path("results");

        return toDomain(results);
    }

    /** Adapter: map Adzuna payload -> our JobPosting domain. */
    private List<JobPosting> toDomain(JsonNode results) {
        return results.findValuesAsText("id") // any fast way just to loop; we’ll loop properly:
                .stream()
                .map(id -> results) // dummy to keep stream signature simple; will replace in classic for-each
                .flatMap(node -> {
                    Set<JobPosting> items = new HashSet<>();
                    for (JsonNode n : node) {
                        Set<String> skills = inferSkills(n.path("description").asText());
                        JobPosting jp = JobPosting.builder()
                                .provider(JobSource.ADZUNA)
                                .providerId(n.path("id").asText())
                                .title(n.path("title").asText())
                                .company(n.path("company").path("display_name").asText(""))
                                .location(n.path("location").path("display_name").asText(""))
                                .workType(inferWorkType(n))
                                .seniority(inferSeniority(n.path("title").asText()))
                                .skills(skills)
                                .salary(SalaryRange.builder()
                                        .min(n.path("salary_min").isNumber() ? n.path("salary_min").asInt() : null)
                                        .max(n.path("salary_max").isNumber() ? n.path("salary_max").asInt() : null)
                                        .build())
                                .currency(n.path("salary_currency").asText(null))
                                .postedAt(parseDate(n.path("created").asText(null)))
                                .url(n.path("redirect_url").asText(null))
                                .description(n.path("description").asText(null))
                                .build();
                        items.add(jp);
                    }
                    return items.stream();
                })
                .toList();
    }

    private Instant parseDate(String s) {
        try { return s == null ? null : Instant.parse(s); }
        catch (Exception e) { return null; }
    }

    private WorkType inferWorkType(JsonNode n) {
        String desc = (n.path("title").asText("") + " " + n.path("description").asText("")).toLowerCase();
        if (desc.contains("remote")) return WorkType.REMOTE;
        if (desc.contains("hybrid")) return WorkType.HYBRID;
        if (desc.contains("on-site") || desc.contains("on site") || desc.contains("onsite")) return WorkType.ONSITE;
        return WorkType.UNKNOWN;
    }

    private Seniority inferSeniority(String title) {
        String t = title.toLowerCase();
        if (t.contains("junior")) return Seniority.JUNIOR;
        if (t.contains("senior") || t.contains("lead") || t.contains("principal")) return Seniority.SENIOR;
        return Seniority.MID; // best-effort default
    }

    /** Very lightweight skill inference; the Python service does the heavy lifting for CVs. */
    private Set<String> inferSkills(String text) {
        String d = text == null ? "" : text.toLowerCase();
        String[] known = {"java","spring","spring boot","react","docker","kubernetes","aws","gcp","azure",
                "postgresql","mysql","mongodb","redis","kafka","rabbitmq","jenkins","git","rest","graphql"};
        Set<String> out = new HashSet<>();
        for (String k : known) if (d.contains(k)) out.add(k);
        return out;
    }
}

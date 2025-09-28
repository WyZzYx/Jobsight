package ai.jobsight.providers.mock;

import ai.jobsight.domain.JobPosting;
import ai.jobsight.domain.SalaryRange;
import ai.jobsight.domain.enums.JobSource;
import ai.jobsight.domain.enums.WorkType;
import ai.jobsight.domain.query.JobSearchQuery;
import ai.jobsight.providers.JobProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Component
public class MockProvider implements JobProvider {

    @Value("${providers.mock.enabled:true}")
    private boolean enabled;

    @Override public String name() { return JobSource.MOCK.name(); }
    @Override public boolean enabled() { return enabled; }

    @Override
    public List<JobPosting> search(JobSearchQuery q) {
        // Useful for local dev / demo when API keys are missing
        return List.of(
                JobPosting.builder()
                        .provider(JobSource.MOCK).providerId("1")
                        .title("Junior Java Developer")
                        .company("Acme")
                        .location(q.location() == null ? "Warsaw" : q.location())
                        .workType(WorkType.HYBRID)
                        .skills(Set.of("java","spring","docker"))
                        .salary(SalaryRange.builder().min(8000).max(12000).build())
                        .currency("PLN").postedAt(Instant.now())
                        .url("https://example.com/jobs/1")
                        .description("Junior role in Java + Spring.")
                        .build()
        );
    }
}

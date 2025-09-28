package ai.jobsight.providers;

import ai.jobsight.domain.JobPosting;
import ai.jobsight.domain.query.JobSearchQuery;

import java.util.List;

/**
 * Strategy interface for job providers (Adzuna, Mock, future LinkedIn/JustJoin adapters).
 * Each provider adapts remote response into our unified JobPosting domain model.
 */
public interface JobProvider {
    String name(); // e.g. "ADZUNA"
    boolean enabled();
    List<JobPosting> search(JobSearchQuery query) throws Exception;
}

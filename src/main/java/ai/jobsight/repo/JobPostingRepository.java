package ai.jobsight.repo;

import ai.jobsight.domain.JobPosting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    Page<JobPosting> findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(
            String title, String location, Pageable pageable
    );

    boolean existsByProviderAndProviderId(ai.jobsight.domain.enums.JobSource provider, String providerId);
}

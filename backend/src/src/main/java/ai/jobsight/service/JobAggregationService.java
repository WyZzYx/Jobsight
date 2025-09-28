package ai.jobsight.service;

import ai.jobsight.domain.JobPosting;
import ai.jobsight.domain.enums.JobSource;
import ai.jobsight.domain.query.JobSearchQuery;
import ai.jobsight.dto.JobPostingDTO;
import ai.jobsight.dto.PagedResponse;
import ai.jobsight.mapper.JobPostingMapper;
import ai.jobsight.providers.ProviderRegistry;
import ai.jobsight.repo.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates providers (Strategy), merges results, dedupes, and persists.
 * Also serves DB-backed paging for stable listing.
 */
@Service
@RequiredArgsConstructor
public class JobAggregationService {
    private final ProviderRegistry registry;
    private final JobPostingRepository repo;

    @Transactional
    public PagedResponse<JobPostingDTO> searchAndStore(JobSearchQuery q) {
        List<JobPosting> collected = new ArrayList<>();

        registry.all().forEach(p -> {
            try {
                collected.addAll(p.search(q));
            } catch (Exception e) {
                // Log and continue; resilience annotations already retry/CB.
            }
        });

        // Deduplicate by (provider, providerId)
        Map<String, JobPosting> unique = collected.stream()
                .collect(Collectors.toMap(
                        j -> j.getProvider().name() + "::" + j.getProviderId(),
                        j -> j,
                        (a,b) -> a
                ));

        // Upsert new items (we only insert new ones to keep it simple)
        unique.values().forEach(j -> {
            if (!repo.existsByProviderAndProviderId(j.getProvider(), j.getProviderId())) {
                repo.save(j);
            }
        });

        // Query DB for paged results (consistent paging)
        Pageable pageable = PageRequest.of(Optional.ofNullable(q.page()).orElse(0),
                Optional.ofNullable(q.size()).orElse(20),
                Sort.by(Sort.Direction.DESC, "postedAt"));
        Page<JobPosting> page = repo.findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(
                Optional.ofNullable(q.title()).orElse(""),
                Optional.ofNullable(q.location()).orElse(""),
                pageable
        );

        List<JobPostingDTO> dtos = page.stream().map(JobPostingMapper::toDto).toList();
        return new PagedResponse<>(dtos, page.getTotalElements(), page.getNumber(), page.getSize());
    }
}

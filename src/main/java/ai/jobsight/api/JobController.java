package ai.jobsight.api;

import ai.jobsight.domain.query.JobSearchQuery;
import ai.jobsight.dto.*;
import ai.jobsight.service.JobAggregationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobAggregationService service;

    @PostMapping("/search")
    public PagedResponse<JobPostingDTO> search(@Valid @RequestBody JobSearchRequest req) {
        var q = JobSearchQuery.builder()
                .title(req.title())
                .location(req.location())
                .techStack(req.techStack())
                .remoteOnly(req.remoteOnly())
                .page(req.page())
                .size(req.size())
                .build();

        return service.searchAndStore(q);
    }
}

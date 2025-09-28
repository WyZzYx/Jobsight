// src/main/java/ai/jobsight/service/JobSearchService.java
package ai.jobsight.service;

import ai.jobsight.dto.JobPostingDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobSearchService {
    private final AdzunaFacade adzunaFacade;

    public List<JobPostingDTO> search(String query, String location, boolean remote, Integer minSalary,
                                      String sort, String order, int page, int size) {
        return adzunaFacade.search(query, location, page, size);
    }
}

package ai.jobsight.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record JobSearchRequest(
        @Size(min = 2, max = 128) String title,
        String location,
        Set<String> techStack,
        Boolean remoteOnly,
        @Min(0) Integer page,
        @Min(1) @Max(100) Integer size
) {}

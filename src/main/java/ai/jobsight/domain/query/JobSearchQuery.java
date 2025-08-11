package ai.jobsight.domain.query;

import lombok.Builder;

import java.util.Set;

/** Immutable search query object (Builder pattern). */
@Builder
public record JobSearchQuery(
        String title,
        String location,
        Set<String> techStack,
        Boolean remoteOnly,
        Integer page,
        Integer size
) {}

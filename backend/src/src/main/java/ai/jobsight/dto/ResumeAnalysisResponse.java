package ai.jobsight.dto;

import java.util.List;

public record ResumeAnalysisResponse(
        List<String> extractedSkills,
        List<String> strengths,
        List<String> gaps,
        List<String> suggestions
) {}
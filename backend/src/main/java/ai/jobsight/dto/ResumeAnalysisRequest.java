package ai.jobsight.dto;

import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/** For multipart use in controller method parameters. */
public record ResumeAnalysisRequest(
        MultipartFile file,
        String targetTitle,
        String location,
        Set<String> preferredStack
) {}

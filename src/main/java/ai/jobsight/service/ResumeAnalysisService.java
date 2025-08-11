package ai.jobsight.service;

import ai.jobsight.dto.ResumeAnalysisResponse;
import ai.jobsight.dto.SkillStatDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Bridges to Python microservice for skill extraction,
 * then compares to market top skills to produce gaps/suggestions.
 */
@Service
@RequiredArgsConstructor
public class ResumeAnalysisService {

    @Value("${resume.analyzer.baseUrl}")
    private String analyzerBase;

    private final StatsService statsService;
    private final RestClient rest = RestClient.create();

    public ResumeAnalysisResponse analyze(MultipartFile file, String targetTitle, String location, Set<String> preferredStack) {
        // 1) Call Python service
        var body = new LinkedMultiValueMap<String, Object>();
        body.add("file", new HttpEntity<>(toBytes(file), createFileHeaders(file)));
        body.add("language", "en");

        var response = rest.post()
                .uri(analyzerBase + "/analyze")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        @SuppressWarnings("unchecked")
        List<String> extracted = (List<String>) response.getOrDefault("skills", List.of());

        // 2) Market top skills
        List<SkillStatDTO> marketTop = statsService.topSkills(targetTitle, location, 20);
        Set<String> topSkills = marketTop.stream().map(SkillStatDTO::skill).collect(Collectors.toCollection(LinkedHashSet::new));

        // 3) Compute strengths/gaps
        Set<String> cv = new LinkedHashSet<>(extracted.stream().map(String::toLowerCase).toList());
        List<String> strengths = topSkills.stream().filter(cv::contains).toList();
        List<String> gaps = topSkills.stream().filter(s -> !cv.contains(s)).toList();

        // 4) Suggestions (very simple rule-based for now)
        List<String> suggestions = new ArrayList<>();
        if (gaps.contains("docker") && preferredStack != null && preferredStack.contains("java")) {
            suggestions.add("Learn Docker (build/push images, run local Postgres) and add it to your Java project README.");
        }
        if (gaps.contains("spring boot")) {
            suggestions.add("Add a Spring Boot project with REST + JPA + tests; deploy it in Docker Compose.");
        }
        if (gaps.contains("kubernetes")) {
            suggestions.add("Learn basics of Kubernetes (Deployments, Services); try minikube to deploy your API.");
        }

        return new ResumeAnalysisResponse(extracted, strengths, gaps, suggestions);
    }

    private static byte[] toBytes(MultipartFile f) {
        try { return f.getBytes(); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private static HttpHeaders createFileHeaders(MultipartFile file) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        ContentDisposition cd = ContentDisposition.builder("form-data")
                .name("file")
                .filename(Objects.requireNonNullElse(file.getOriginalFilename(), "cv.pdf"))
                .build();
        h.setContentDisposition(cd);
        return h;
    }
}

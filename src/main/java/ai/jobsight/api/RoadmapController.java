package ai.jobsight.api;

import ai.jobsight.dto.PreciseRoadmapRequest;
import ai.jobsight.service.ProfileService;
import ai.jobsight.service.RoadmapGeneratorService;
import ai.jobsight.service.RoadmapService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roadmap")
public class RoadmapController {

    private final RestClient resumeClient;
    private final RoadmapService roadmapService;
    private final ProfileService profileService;
    private final RoadmapGeneratorService service;

    // EXPLICIT constructor with qualifier for the resume client
    public RoadmapController(
            @Qualifier("resumeClient") RestClient resumeClient,
            RoadmapService roadmapService,
            ProfileService profileService,
            RoadmapGeneratorService service
    ) {
        this.resumeClient = resumeClient;
        this.roadmapService = roadmapService;
        this.profileService = profileService;
        this.service = service;
    }
    @PostMapping(value = "/precise", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> precise(@RequestBody PreciseRoadmapRequest req) {
        return service.buildPrecisePlan(req);
    }

    @Data public static class FromSkillsRequest {
        private List<String> skills;
        private String roleId;
        private Long userId;
    }

    @PostMapping(value = "/from-resume",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public RoadmapService.Roadmap fromResume(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String roleId,
            @RequestParam(defaultValue = "1") Long userId
    ) throws IOException {

        var resource = new ByteArrayResource(file.getBytes()) {
            @Override public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.txt";
            }
        };
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("file", resource);

        @SuppressWarnings("unchecked")
        var body = (Map<String, Object>) resumeClient.post()
                .uri("/analyze")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(parts)
                .retrieve()
                .body(Map.class);

        var skills = (List<String>) body.getOrDefault("skills", List.of());
        profileService.saveSkills(userId, skills);
        return roadmapService.buildFromSkills(skills, roleId == null ? "java-backend" : roleId);
    }

    @PostMapping(value = "/from-skills", consumes = MediaType.APPLICATION_JSON_VALUE)
    public RoadmapService.Roadmap fromSkills(@RequestBody FromSkillsRequest req) {
        if (req.getUserId() != null) {
            profileService.saveSkills(req.getUserId(), req.getSkills());
        }
        return roadmapService.buildFromSkills(req.getSkills(), req.getRoleId());
    }
}

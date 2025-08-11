package ai.jobsight.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
public class ResumeController {
    private final WebClient resumeWebClient;

    @PostMapping(
            value = "/api/resume/analyze",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public Map<?,?> analyze(@RequestPart("file") MultipartFile file) {
        var filename = Objects.requireNonNullElse(file.getOriginalFilename(), "resume.txt");
        var contentType = file.getContentType() != null
                ? MediaType.parseMediaType(file.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;

        var mb = new MultipartBodyBuilder();
        mb.part("file", file.getResource())
                .filename(filename)
                .contentType(contentType);

        return resumeWebClient.post()
                .uri("/analyze")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(mb.build()))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}

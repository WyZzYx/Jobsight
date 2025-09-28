package ai.jobsight.service;

import ai.jobsight.dto.JobPostingDTO;
import ai.jobsight.domain.enums.WorkType;
import ai.jobsight.providers.adzuna.AdzunaProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdzunaFacade {

    private final RestClient http;          // qualified RestClient
    private final AdzunaProperties props;   // your props (baseUrl, appId, appKey, country)
    private final ObjectMapper mapper;      // shared Jackson mapper bean

    public AdzunaFacade(
            @Qualifier("adzunaRestClient") RestClient http,
            AdzunaProperties props,
            ObjectMapper mapper
    ) {
        this.http = http;
        this.props = props;
        this.mapper = mapper;
    }

    public List<JobPostingDTO> search(String query, String location, int page, int size) {
        int adzunaPage = Math.max(1, page + 1);
        int perPage = Math.min(Math.max(size, 1), 50);

        String country = Optional.ofNullable(props.getCountry()).orElse("").trim();
        if (country.isEmpty()) {
            throw new IllegalStateException("providers.adzuna.country is empty");
        }

        URI uri = UriComponentsBuilder.fromHttpUrl(props.getBaseUrl())
                .pathSegment(country, "search", String.valueOf(adzunaPage))
                .queryParam("app_id", props.getAppId())
                .queryParam("app_key", props.getAppKey())
                .queryParam("results_per_page", perPage)
                .queryParam("what", query == null ? "" : query.trim())
                .queryParam("where", location == null ? "" : location.trim())
                .queryParam("sort_by", "date")
                .build(true)
                .toUri();

        String safeUrl = uri.toString()
                .replace(props.getAppId(), "****")
                .replace(props.getAppKey(), "****");
        log.info("Adzuna GET {}", safeUrl);

        ResponseEntity<String> resp = http.get().uri(uri).retrieve().toEntity(String.class);
        int status = resp.getStatusCode().value();
        log.info("Adzuna status {}", status);

        if (status < 200 || status >= 300 || resp.getBody() == null) {
            log.warn("Adzuna non-2xx: {}", status);
            return List.of();
        }

        try {
            AdzunaResponse parsed = mapper.readValue(resp.getBody(), AdzunaResponse.class);
            if (parsed.results == null) return List.of();

            return parsed.results.stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to parse Adzuna payload", e);
            return List.of();
        }
    }

    private JobPostingDTO toDTO(AdzunaJob r) {
        String title = opt(r.title);
        String company = r.company != null ? opt(r.company.displayName) : null;
        String loc = r.location != null ? opt(r.location.displayName) : null;
        Double min = r.salaryMin;
        Double max = r.salaryMax;
        String currency = opt(r.currency);
        String url = opt(r.redirectUrl);
        Instant created = parseInstant(r.created);

        WorkType wt = deriveWorkType(title, loc);

        return JobPostingDTO.builder()
                .title(title)
                .company(company)
                .location(loc)
                .workType(wt)
                .salaryMin(min == null ? null : min.intValue())
                .salaryMax(max == null ? null : max.intValue())
                .currency(currency)
                .postedAt(created)
                .url(url)
                .build();
    }

    private static String opt(String s) { return (s == null || s.isBlank()) ? null : s; }

    private static Instant parseInstant(String iso) {
        try { return iso == null ? null : Instant.parse(iso); }
        catch (Exception e) { return null; }
    }

    private static WorkType deriveWorkType(String title, String loc) {
        String t = (title == null ? "" : title).toLowerCase(Locale.ROOT);
        String l = (loc == null ? "" : loc).toLowerCase(Locale.ROOT);
        if (t.contains("remote") || l.contains("remote")) return WorkType.REMOTE;
        if (t.contains("hybrid") || l.contains("hybrid")) return WorkType.HYBRID;
        return WorkType.ONSITE;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AdzunaResponse {
        public List<AdzunaJob> results;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AdzunaJob {
        public String title;
        public AdzunaCompany company;
        public AdzunaLocation location;
        @JsonProperty("salary_min") public Double salaryMin;
        @JsonProperty("salary_max") public Double salaryMax;
        public String currency;
        @JsonProperty("created") public String created;
        @JsonProperty("redirect_url") public String redirectUrl;
        public String description;
        @JsonProperty("contract_time") public String contractTime;
        @JsonProperty("contract_type") public String contractType;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AdzunaCompany {
        @JsonProperty("display_name") public String displayName;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AdzunaLocation {
        @JsonProperty("display_name") public String displayName;
    }
}

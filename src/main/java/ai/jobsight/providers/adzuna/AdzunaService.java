package ai.jobsight.providers.adzuna;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class AdzunaService {

    @Value("${ADZUNA_APP_ID}")
    private String appId;

    @Value("${ADZUNA_APP_KEY}")
    private String appKey;

    @Value("${ADZUNA_COUNTRY}")
    private String country; // e.g. "pl", "gb", "us"…

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * @param what          search text (keywords)
     * @param whatExclude   exclude keywords
     * @param where         location string
     * @param salaryMin     minimum salary (int or null)
     * @param fullTime      1/0
     * @param permanent     1/0
     * @param sortBy        "date" | "salary" | "relevance"
     * @param pageZeroBased client page index (0-based)
     * @param size          results per page
     */
    public String search(
            String what,
            String whatExclude,
            String where,
            Integer salaryMin,
            boolean fullTime,
            boolean permanent,
            String sortBy,
            int pageZeroBased,
            int size
    ) {
        // Adzuna is 1-based page path: /search/{page}
        int adzunaPage = Math.max(1, pageZeroBased + 1);

        UriComponentsBuilder uri = UriComponentsBuilder
                .fromUriString("https://api.adzuna.com/v1/api/jobs/" + country + "/search/" + adzunaPage)
                .queryParam("app_id", appId)
                .queryParam("app_key", appKey)
                .queryParam("results_per_page", size)
                .queryParam("content-type", "application/json");

        if (what != null && !what.isBlank()) uri.queryParam("what", what);
        if (whatExclude != null && !whatExclude.isBlank()) uri.queryParam("what_exclude", whatExclude);
        if (where != null && !where.isBlank()) uri.queryParam("where", where);
        if (salaryMin != null) uri.queryParam("salary_min", salaryMin);
        if (sortBy != null && !sortBy.isBlank()) uri.queryParam("sort_by", sortBy);
        // Adzuna expects 1/0 for these flags
        uri.queryParam("full_time", fullTime ? 1 : 0);
        uri.queryParam("permanent", permanent ? 1 : 0);

        String url = uri.toUriString();
        System.out.println("Calling Adzuna: " + url);

        try {
            return restTemplate.getForObject(url, String.class);
        } catch (HttpStatusCodeException e) {
            // Bubble up real status + body so the frontend can show a useful message
            throw new RuntimeException(
                    "Adzuna API " + e.getStatusCode() + ": " + e.getResponseBodyAsString(), e
            );
        }
    }
}

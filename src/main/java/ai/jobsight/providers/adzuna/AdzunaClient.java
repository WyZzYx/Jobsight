package ai.jobsight.providers.adzuna;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class AdzunaClient {

    @Value("${providers.adzuna.baseUrl}")
    private String baseUrl;

    @Value("${providers.adzuna.country}")
    private String country;

    @Value("${providers.adzuna.appId}")
    private String appId;

    @Value("${providers.adzuna.appKey}")
    private String appKey;

    private final RestClient rest = RestClient.create();

    public String search(String what, String where, int page, int size) {
        // NOTE: Adzuna's public API docs: /{country}/search/{page}?app_id=...&app_key=...&what=...&where=...
        String url = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/" + country + "/search/" + (page + 1))
                .queryParam("app_id", appId)
                .queryParam("app_key", appKey)
                .queryParam("what", what)
                .queryParam("where", where)
                .queryParam("results_per_page", size)
                .build(true)
                .toUriString();

        return rest.get().uri(url).retrieve().body(String.class);
    }
}

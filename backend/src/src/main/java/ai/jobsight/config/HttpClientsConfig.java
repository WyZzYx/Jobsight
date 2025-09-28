package ai.jobsight.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientsConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean // used by /api/roadmap/from-resume
    public RestClient resumeClient(RestClient.Builder b,
                                   @Value("${RESUME_ANALYZER_BASE_URL:http://resume-analyzer:9000}") String base) {
        return b.baseUrl(base).build();
    }

    @Bean // used by Adzuna service
    public RestClient adzunaRestClient(RestClient.Builder b,
                                       @Value("${ADZUNA_BASE_URL:https://api.adzuna.com/v1/api/jobs}") String base) {
        return b.baseUrl(base).build();
    }


}

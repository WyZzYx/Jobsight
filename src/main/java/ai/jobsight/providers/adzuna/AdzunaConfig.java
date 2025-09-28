package ai.jobsight.providers.adzuna;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(AdzunaProperties.class)
public class AdzunaConfig {

//    @Bean
//    RestClient adzunaRestClient(AdzunaProperties props) {
//        return RestClient.builder()
//                .baseUrl(props.getBaseUrl())
//                .build();
//    }
}

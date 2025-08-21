package ai.jobsight.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@ConfigurationProperties(prefix = "resume.analyzer")
public class ResumeAnalyzerClientConfig {

    // mapped from application.yml: resume.analyzer.baseUrl
    private String baseUrl = "http://resume-analyzer:9000";
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    @Bean
    public RestClient resumeClient(RestClient.Builder builder) {
        return builder.baseUrl(baseUrl).build();
    }
}

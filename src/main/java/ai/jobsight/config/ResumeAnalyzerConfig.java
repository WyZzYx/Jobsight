package ai.jobsight.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ResumeAnalyzerConfig {
    @Bean
    WebClient resumeWebClient(@Value("${resume.analyzer.baseUrl}") String baseUrl) {
        return WebClient.builder().baseUrl(baseUrl).build();
    }

}
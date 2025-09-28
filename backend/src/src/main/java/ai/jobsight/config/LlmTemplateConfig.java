package ai.jobsight.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class LlmTemplateConfig {

    @Bean("llmTemplate")
    public RestTemplate llmTemplate(
            @Value("${ollama.base-url:http://ollama:11434}") String baseUrl,
            ObjectMapper mapper
    ) {
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        return new RestTemplateBuilder()
                .rootUri(baseUrl) // e.g. http://ollama:11434 (HTTP, not HTTPS)
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(120))
                .additionalMessageConverters(new MappingJackson2HttpMessageConverter(mapper))
                .build();
    }
}

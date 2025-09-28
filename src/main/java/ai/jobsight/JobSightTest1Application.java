package ai.jobsight;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan(basePackages = "ai.jobsight")
public class JobSightTest1Application {

    public static void main(String[] args) {
        SpringApplication.run(JobSightTest1Application.class, args);
    }

}

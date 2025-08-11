package ai.jobsight.dto;

import ai.jobsight.domain.enums.WorkType;
import lombok.*;

import java.time.Instant;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPostingDTO {
    public Long id;
    public String title;
    public String company;
    public String location;
    public WorkType workType;
    public Set<String> skills;
    public Integer salaryMin;
    public Integer salaryMax;
    public String currency;
    public Instant postedAt;
    public String url;
    public String provider; // "ADZUNA", etc.
}

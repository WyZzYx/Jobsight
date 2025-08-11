package ai.jobsight.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalaryRange {
    private Integer min; // monthly or yearly (provider-normalized note)
    private Integer max;
}

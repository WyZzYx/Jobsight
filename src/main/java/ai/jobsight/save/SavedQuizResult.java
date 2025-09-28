// src/main/java/ai/jobsight/save/SavedQuizResult.java
package ai.jobsight.save;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedQuizResult {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false) Long userId;
    @Column(columnDefinition="jsonb") String resultJson; // your quiz result structure
    Instant createdAt;
}

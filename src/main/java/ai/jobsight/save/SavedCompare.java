package ai.jobsight.save;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedCompare {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false) Long userId;
    @Column(columnDefinition="jsonb") String jobsJson; // store up to 3 selected job cards as JSON
    Instant createdAt;
    String title; // optional label
}

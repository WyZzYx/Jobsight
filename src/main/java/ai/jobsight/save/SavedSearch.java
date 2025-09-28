package ai.jobsight.save;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedSearch {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false) Long userId;
    String what;
    @Column(name = "where_query")   // or "location_query"
    String location;
    String sortBy;
    Boolean fullTime;
    Boolean permanent;
    Instant createdAt;
}

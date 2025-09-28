package ai.jobsight.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
public class UserSkill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) private UserProfile user;
    @ManyToOne(optional = false) private Skill skill;

    private Integer level;
    @Builder.Default private Instant addedAt = Instant.now();
}

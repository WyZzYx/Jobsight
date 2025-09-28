// src/main/java/ai/jobsight/save/SavedRoadmap.java
package ai.jobsight.save;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "saved_roadmap")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedRoadmap {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String title;          // e.g. "Junior Java (3 months)"
    private String source;         // e.g. "precise" | "from-skills" | "manual"

    // <-- IMPORTANT: jsonb mapping
    @Column(name = "plan_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> planJson;

    @Column(name = "plan_text", columnDefinition = "text")
    private String planText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

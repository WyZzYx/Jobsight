package ai.jobsight.domain;


import ai.jobsight.domain.enums.JobSource;
import ai.jobsight.domain.enums.Seniority;
import ai.jobsight.domain.enums.WorkType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Set;

@Entity
@Table(name = "job_postings", indexes = {
        @Index(name = "idx_provider_providerId", columnList = "provider, providerId", unique = true),
        @Index(name = "idx_title_location", columnList = "title, location"),
        @Index(name = "idx_postedAt", columnList = "postedAt")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Provider name (e.g., ADZUNA) and provider-specific ID for dedupe */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private JobSource provider;

    @Column(nullable = false, length = 128)
    private String providerId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    private WorkType workType; // REMOTE, HYBRID, ONSITE

    @Enumerated(EnumType.STRING)
    private Seniority seniority; // JUNIOR, MID, SENIOR (best-effort mapping)

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    private Set<String> skills;

    @Embedded
    private SalaryRange salary;

    private String currency;

    private Instant postedAt;

    @Column(length = 1024)
    private String url;

    @Column(length = 8192)
    private String description;
}

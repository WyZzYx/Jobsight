package ai.jobsight.dto;

import lombok.Data;

/**
 * All fields optional except targetRole. Keep names exactly as the frontend sends.
 */
@Data
public class PreciseRoadmapRequest {
    private String targetRole;       // e.g. "Data Analyst"
    private String currentSkills;    // e.g. "excel, sql"
    private String timelineMonths;   // e.g. "4"
    private String country;          // e.g. "PL"

    private Integer age;
    private String major;
    private String experience;       // free text
    private String goals;            // free text
}

package ai.jobsight.mapper;

import ai.jobsight.domain.JobPosting;
import ai.jobsight.dto.JobPostingDTO;

public class JobPostingMapper {
    public static JobPostingDTO toDto(JobPosting j) {
        return JobPostingDTO.builder()
                .id(j.getId())
                .title(j.getTitle())
                .company(j.getCompany())
                .location(j.getLocation())
                .workType(j.getWorkType())
                .skills(j.getSkills())
                .salaryMin(j.getSalary() == null ? null : j.getSalary().getMin())
                .salaryMax(j.getSalary() == null ? null : j.getSalary().getMax())
                .currency(j.getCurrency())
                .postedAt(j.getPostedAt())
                .url(j.getUrl())
                .provider(j.getProvider().name())
                .build();
    }
}

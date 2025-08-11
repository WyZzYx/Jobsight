package ai.jobsight.service;

import ai.jobsight.dto.SkillStatDTO;
import ai.jobsight.repo.JobPostingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;

import java.util.List;

/** Simple skill-frequency stats over current snapshot. */
@Service
public class StatsService {
    @PersistenceContext
    private EntityManager em;

    public List<SkillStatDTO> topSkills(String title, String location, int limit) {
        // Using JPQL/SQL would be fine; here we use native for speed & set aggregation
        String sql = """
        select s.skill as skill, count(*) as cnt
        from job_postings j
        join job_skills s on s.job_id = j.id
        where lower(j.title) like lower(concat('%', :title, '%'))
          and lower(j.location) like lower(concat('%', :loc, '%'))
        group by s.skill
        order by cnt desc
        limit :lim
        """;
        var q = em.createNativeQuery(sql)
                .setParameter("title", title == null ? "" : title)
                .setParameter("loc", location == null ? "" : location)
                .setParameter("lim", limit);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();

        return rows.stream()
                .map(r -> new SkillStatDTO((String) r[0], ((Number) r[1]).longValue()))
                .toList();
    }
}

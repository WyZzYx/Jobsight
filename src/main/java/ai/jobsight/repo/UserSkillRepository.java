package ai.jobsight.repo;
import ai.jobsight.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    boolean existsByUserAndSkill(UserProfile user, Skill skill);
}

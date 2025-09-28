package ai.jobsight.repo;

import ai.jobsight.save.SavedQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedQuizResultRepo extends JpaRepository<SavedQuizResult, Long> {
    List<SavedQuizResult> findByUserId(Long userId);
}

package ai.jobsight.repo;

import ai.jobsight.save.SavedCompare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedCompareRepo extends JpaRepository<SavedCompare, Long> {
    List<SavedCompare> findByUserId(Long userId);
}
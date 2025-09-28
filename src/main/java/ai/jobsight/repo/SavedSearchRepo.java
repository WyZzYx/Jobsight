package ai.jobsight.repo;

import ai.jobsight.save.SavedSearch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedSearchRepo extends JpaRepository<SavedSearch, Long> {
    List<SavedSearch> findByUserId(Long userId);
}


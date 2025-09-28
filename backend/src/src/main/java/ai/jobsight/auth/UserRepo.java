package ai.jobsight.auth;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}

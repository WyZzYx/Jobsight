package ai.jobsight.service;

import ai.jobsight.domain.*;
import ai.jobsight.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserProfileRepository users;
    private final SkillRepository skills;
    private final UserSkillRepository userSkills;

    @Transactional
    public UserProfile ensureUser(Long idOrNull) {
        if (idOrNull != null) return users.findById(idOrNull).orElseGet(() -> users.save(UserProfile.builder().id(idOrNull).displayName("User"+idOrNull).build()));
        return users.save(UserProfile.builder().displayName("Guest").build());
    }

    @Transactional
    public void saveSkills(Long userId, List<String> names) {
        if (names == null || names.isEmpty()) return;
        var user = users.findById(userId).orElseGet(() -> users.save(UserProfile.builder().id(userId).displayName("User"+userId).build()));
        for (var n : names) {
            var skill = skills.findByNameIgnoreCase(n).orElseGet(() -> skills.save(Skill.builder().name(n.trim()).build()));
            if (!userSkills.existsByUserAndSkill(user, skill)) {
                userSkills.save(UserSkill.builder().user(user).skill(skill).build());
            }
        }
    }
}

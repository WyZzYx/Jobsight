package ai.jobsight.providers;

import org.springframework.stereotype.Component;

import java.util.List;

/** Simple registry for all providers (DI injects all beans). */
@Component
public class ProviderRegistry {
    private final List<JobProvider> providers;

    public ProviderRegistry(List<JobProvider> providers) {
        this.providers = providers;
    }

    public List<JobProvider> all() {
        return providers.stream().filter(JobProvider::enabled).toList();
    }
}

package ai.jobsight.providers.adzuna;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "providers.adzuna")
public class AdzunaProperties {
    private boolean enabled = true;
    private String baseUrl = "https://api.adzuna.com/v1/api/jobs";
    private String country = "pl";
    private String appId;
    private String appKey;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getAppKey() { return appKey; }
    public void setAppKey(String appKey) { this.appKey = appKey; }
}

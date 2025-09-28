package ai.jobsight.api;

import ai.jobsight.providers.adzuna.AdzunaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:3000"},
        allowCredentials = "true"
)
public class JobSearchController {

    private final AdzunaService adzuna;

    // Example:
    // /api/jobs/search?query=java&location=Warsaw&page=0&size=10&sortBy=date
    @GetMapping("/search")
    public ResponseEntity<String> search(
            @RequestParam(required = false, name = "what") String what,
            @RequestParam(required = false, name = "query") String queryAlias,
            @RequestParam(required = false, name = "whatExclude") String whatExclude,
            @RequestParam(required = false, name = "where") String where,
            @RequestParam(required = false, name = "location") String locationAlias,
            @RequestParam(required = false, name = "salaryMin") Integer salaryMin,
            @RequestParam(required = false, defaultValue = "false") boolean fullTime,
            @RequestParam(required = false, defaultValue = "false") boolean permanent,
            @RequestParam(required = false, defaultValue = "date") String sortBy,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        String effectiveWhat = (what != null && !what.isBlank()) ? what : queryAlias;
        String effectiveWhere = (where != null && !where.isBlank()) ? where : locationAlias;

        String json = adzuna.search(
                effectiveWhat,
                whatExclude,
                effectiveWhere,
                salaryMin,
                fullTime,
                permanent,
                sortBy,
                page,
                size
        );
        return ResponseEntity.ok(json);
    }
}

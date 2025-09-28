package ai.jobsight.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity @Table(name="users", uniqueConstraints=@UniqueConstraint(columnNames="email"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false, length=160) String email;
    @Column(nullable=false, length=120) String passwordHash;
    @Column(nullable=false) Instant createdAt;
    String name;
    String country;
}

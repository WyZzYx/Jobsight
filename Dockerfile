# ---------- build ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# gradle wrapper first (cache)
COPY gradlew ./
COPY gradle/wrapper/gradle-wrapper.jar gradle/wrapper/gradle-wrapper.jar
COPY gradle/wrapper/gradle-wrapper.properties gradle/wrapper/gradle-wrapper.properties
RUN chmod +x gradlew && ./gradlew --version

COPY build.gradle settings.gradle ./
COPY src ./src

RUN ./gradlew --no-daemon clean bootJar
RUN ls -la build/libs  # must show app.jar

# ---------- runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/app.jar ./app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

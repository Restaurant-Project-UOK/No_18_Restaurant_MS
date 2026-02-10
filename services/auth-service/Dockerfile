# Stage 1: Build the application using Java 21 and Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Java 21 JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
# Note: Ensure the .jar name matches the artifactId in your pom.xml
COPY --from=build /app/target/auth_service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
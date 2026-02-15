# Multi-stage Dockerfile for promotion-service (Spring Boot, Java 17)
# Builder: use Maven to produce the executable jar
FROM maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /workspace
COPY . ./
RUN chmod +x mvnw || true
RUN ./mvnw -B -DskipTests package

# Runtime image
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
ARG JAR_FILE=target/*.jar
COPY --from=builder /workspace/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
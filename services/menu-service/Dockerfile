# Multi-stage Dockerfile for menu-service (Spring Boot, Java 17)
# Builder: use Maven to produce the executable jar
FROM maven:3.8.8-jdk-17 AS builder
WORKDIR /workspace
COPY . ./
RUN chmod +x mvnw || true
RUN ./mvnw -B -DskipTests package

# Runtime image
FROM openjdk:17-jdk-slim
WORKDIR /app
ARG JAR_FILE=target/*.jar
COPY --from=builder /workspace/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

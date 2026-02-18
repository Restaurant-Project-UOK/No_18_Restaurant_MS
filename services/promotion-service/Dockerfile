# Stage 1: Builder
FROM maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /workspace

# Step 1: Only copy pom.xml and download dependencies
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

# Step 2: Copy source code and build
COPY src ./src
RUN ./mvnw -B -DskipTests package

# Stage 2: Runtime image
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=builder /workspace/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
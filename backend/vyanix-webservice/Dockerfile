FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache wget
RUN addgroup --system --gid 1001 spring && adduser --system --uid 1001 spring -G spring
COPY --from=builder /build/target/*.jar app.jar
USER spring:spring
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
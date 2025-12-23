# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Palette is a friend-network dating app where trust meets connection. This is a Kotlin-based Spring Boot 4.0.1 application using Java 21.

## Build and Run Commands

### Building the Project
```bash
./gradlew build
```

### Running the Application
```bash
./gradlew bootRun
```

### Running Tests
```bash
# Run all tests
./gradlew test

# Run a specific test class
./gradlew test --tests kr.ai.palette.PaletteApplicationTests

# Run a specific test method
./gradlew test --tests kr.ai.palette.PaletteApplicationTests.contextLoads
```

### Cleaning Build Artifacts
```bash
./gradlew clean
```

## Technology Stack

- **Language**: Kotlin 2.2.21 with Java 21
- **Framework**: Spring Boot 4.0.1
- **Build Tool**: Gradle with Kotlin DSL
- **Database**: H2 (dev/test), MySQL (production)
- **Security**: Spring Security with OAuth2 (both client and authorization server)
- **ORM**: Spring Data JPA with Kotlin JPA plugin
- **Testing**: JUnit 5 (Jupiter)

## Architecture

### Package Structure

The base package is `kr.ai.palette`. This is a newly initialized project with a standard Spring Boot structure.

### Key Dependencies

- **Web Layer**: Spring Web MVC for REST API endpoints
- **Security**: Spring Security with OAuth2 Authorization Server and OAuth2 Client support
- **Data Access**: Spring Data JPA for database operations
- **Caching**: Spring Cache Abstraction
- **HTTP Client**: Spring RestClient for external API calls
- **Monitoring**: Spring Boot Actuator for application health and metrics
- **Database**: MySQL connector for production, H2 for development/testing

### Kotlin Configuration

The project uses Kotlin compiler options:
- JSR-305 strict mode enabled for null-safety
- Annotation default target set to `param-property` for constructor parameters

JPA entities use the `allOpen` plugin to automatically make JPA annotations open for proxy creation:
- `@Entity`
- `@MappedSuperclass`
- `@Embeddable`

## Development Notes

### Java Version

This project requires Java 21. Ensure your JAVA_HOME points to JDK 21:
```bash
java --version  # Should show version 21
```

### Database Configuration

The project supports both H2 (embedded) and MySQL. Database configuration should be set in `application.properties` or environment-specific property files.

### OAuth2 Setup

The application includes both OAuth2 Authorization Server and OAuth2 Client capabilities. When implementing authentication:
- Authorization Server configuration for issuing tokens
- OAuth2 Client configuration for third-party authentication providers
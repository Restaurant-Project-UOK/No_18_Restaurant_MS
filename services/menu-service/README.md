# Menu Service

Spring Boot microservice for managing restaurant menu items and images with Azure Container Apps deployment support.

## Features

- RESTful API for menu management (Items & Categories)
- MySQL database for metadata
- MongoDB GridFS for image storage
- Azure Container Apps deployment support
- Health checks and monitoring (Actuator)
- CI/CD with GitHub Actions

## Prerequisites

- Java 17
- Maven 3.9+
- MySQL 8.0+
- MongoDB 6.0+
- Docker (optional)

## Local Development

### Environment Variables

```bash
DATABASE_URL=jdbc:mysql://localhost:3306/menudb
DATABASE_USERNAME=root
DATABASE_PASSWORD=password
MONGODB_URI=mongodb://localhost:27017/restaurant_media
PORT=8082
```

### Run Application

```bash
# Build
mvn clean package

# Run
mvn spring-boot:run
```

### Run with Docker

```bash
docker build -t menu-service .
docker run -p 8082:8082 \
  -e DATABASE_URL=jdbc:mysql://host.docker.internal:3306/menudb \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/restaurant_media \
  menu-service
```

## API Endpoints

### Health
- `GET /actuator/health` - Health check
- `GET /actuator/health/liveness` - Liveness probe
- `GET /actuator/health/readiness` - Readiness probe

### Menu (Public)
- `GET /api/menu?restaurantId={id}` - Get available menu items
- `GET /api/menu/{id}` - Get single menu item
- `GET /api/categories` - Get all categories

### Admin (Protected)
- `POST /api/admin/menu` - Create menu item (Multipart/form-data)
- `PUT /api/admin/menu/{id}` - Update menu item
- `PATCH /api/admin/menu/{id}/availability` - Update availability
- `POST /api/admin/categories` - Create category

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `jdbc:mysql://localhost:3306/menudb` | MySQL connection URL |
| `DATABASE_USERNAME` | `root` | MySQL username |
| `DATABASE_PASSWORD` | `orderservice@12345` | MySQL password |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection URI |
| `PORT` | `8082` | Server port |

## Azure Deployment

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Service principal JSON |
| `AZURE_CONTAINER_REGISTRY` | ACR login server (e.g., `myacr.azurecr.io`) |
| `ACR_NAME` | Name of the ACR |
| `AZURE_RESOURCE_GROUP` | Resource group name |

### Setup Azure Resources

```bash
# Create resource group
az group create --name menu-service-rg --location eastus

# Create container registry
az acr create --resource-group menu-service-rg --name menuacr --sku Basic --admin-enabled true

# Create container apps environment
az containerapp env create --name menu-env --resource-group menu-service-rg --location eastus

# Create MySQL database (Flexible Server)
az mysql flexible-server create ...
```

### Deploy

1. Configure GitHub Secrets.
2. Configure environment variables in Azure Container Apps.
3. Push to `main` or `master` branch.

## Documentation
Additional documentation can be found in:
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [MENU_SERVICE_README.md](MENU_SERVICE_README.md)
- [CURL_EXAMPLES.md](CURL_EXAMPLES.md)
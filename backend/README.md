# Wear Backend API

Backend API for the Wear e-commerce platform built with Node.js, Express, PostgreSQL, and PgBouncer for connection pooling.

## Features

- **Authentication & Authorization**: JWT-based authentication system
- **Database**: PostgreSQL with PgBouncer connection pooling
- **ORM**: Sequelize for database operations
- **Security**: Helmet, CORS, rate limiting, input validation
- **Performance**: Compression, connection pooling with PgBouncer

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the environment example file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (Direct PostgreSQL - for database creation)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wear_ecommerce
DB_USER=wear_user
DB_PASSWORD=wear_password

# PgBouncer Configuration (for connection pooling)
PGBOUNCER_HOST=localhost
PGBOUNCER_PORT=6432

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Start Database Services

Start PostgreSQL and PgBouncer using Docker Compose:

```bash
npm run db:up
```

This will start:
- PostgreSQL on port 5432
- PgBouncer on port 6432 (connection pooler)

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## Database Management

### Available Commands

```bash
# Start database services
npm run db:up

# Stop database services
npm run db:down

# Restart database services
npm run db:restart

# View database logs
npm run db:logs

# Reset database (removes all data)
npm run db:reset
```

### PgBouncer Configuration

PgBouncer is configured with the following settings:

- **Pool Mode**: Transaction (recommended for most applications)
- **Max Client Connections**: 1000
- **Default Pool Size**: 20
- **Reserve Pool Size**: 5
- **Server Lifetime**: 600 seconds
- **Server Idle Timeout**: 600 seconds

### Connection Flow

```
Application → PgBouncer (port 6432) → PostgreSQL (port 5432)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Health Check
- `GET /health` - Server health status

## Development

### Project Structure

```
src/
├── config/
│   └── database.js      # Database configuration with PgBouncer
├── controllers/         # Route controllers
├── middleware/          # Custom middleware
├── models/             # Sequelize models
├── routes/             # API routes
└── index.js            # Main application file
```

### Database Configuration

The application uses PgBouncer for connection pooling:

- **Direct PostgreSQL**: Used only for database creation
- **PgBouncer**: Used for all application queries
- **Connection Pool**: Optimized for high concurrency
- **Prepared Statements**: Disabled for PgBouncer compatibility

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `PGBOUNCER_HOST` | PgBouncer host | localhost |
| `PGBOUNCER_PORT` | PgBouncer port | 6432 |
| `DB_NAME` | Database name | wear_ecommerce |
| `DB_USER` | Database user | wear_user |
| `DB_PASSWORD` | Database password | wear_password |

## Performance Benefits

With PgBouncer, you get:

1. **Connection Pooling**: Reuses database connections
2. **Reduced Overhead**: Faster connection establishment
3. **Better Scalability**: Handles more concurrent users
4. **Connection Limits**: Prevents database overload
5. **Failover Support**: Automatic connection recovery

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure Docker services are running
2. **Authentication Failed**: Check database credentials in `.env`
3. **Pool Exhausted**: Increase pool size in PgBouncer configuration
4. **Prepared Statement Errors**: Ensure `prepare: false` in Sequelize config

### Logs

View detailed logs:

```bash
# Application logs
npm run dev

# Database logs
npm run db:logs
```

## Production Deployment

For production, consider:

1. **Environment Variables**: Use secure, production-specific values
2. **SSL/TLS**: Enable SSL for database connections
3. **Monitoring**: Set up monitoring for PgBouncer metrics
4. **Backup**: Regular database backups
5. **Scaling**: Consider read replicas for high traffic

## License

MIT


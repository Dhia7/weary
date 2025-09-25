# Wear Backend API

Backend API for the Wear e-commerce platform built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based authentication system
- **Database**: PostgreSQL database
- **ORM**: Sequelize for database operations
- **Security**: Helmet, CORS, rate limiting, input validation
- **Performance**: Compression and optimized queries

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
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

### 3. Set Up Database

Make sure PostgreSQL is installed and running on your system. Then set up the database:

```bash
npm run setup:db
```

This will:
- Create the `wear_db` database
- Set up the database structure
- Create necessary tables and relationships

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
# Set up database
npm run setup:db

# Test database connection
npm run test:postgres

# Validate product data
npm run validate:products

# Check data integrity
npm run check:integrity
```

### Database Configuration

The application connects directly to PostgreSQL:

- **Host**: localhost (or your PostgreSQL host)
- **Port**: 5432 (default PostgreSQL port)
- **Database**: wear_db
- **Connection**: Direct connection to PostgreSQL

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

The application connects directly to PostgreSQL:

- **PostgreSQL**: Used for all database operations
- **Connection**: Direct connection to PostgreSQL
- **ORM**: Sequelize for database operations
- **Migrations**: Automatic table creation and updates

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | wear_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | dhianaija123 |

## Performance Benefits

With direct PostgreSQL connection, you get:

1. **Direct Access**: Fast, direct database access
2. **Full Feature Support**: Access to all PostgreSQL features
3. **Simple Configuration**: Easy setup and maintenance
4. **Reliable Connection**: Stable database connectivity
5. **Sequelize Optimization**: ORM-level query optimization

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure PostgreSQL is running on your system
2. **Authentication Failed**: Check database credentials in `.env`
3. **Database Not Found**: Run `npm run setup:db` to create the database
4. **Port Conflicts**: Ensure PostgreSQL is running on port 5432

### Logs

View detailed logs:

```bash
# Application logs
npm run dev

# Test database connection
npm run test:postgres
```

## Production Deployment

For production, consider:

1. **Environment Variables**: Use secure, production-specific values
2. **SSL/TLS**: Enable SSL for database connections
3. **Monitoring**: Set up monitoring for PostgreSQL metrics
4. **Backup**: Regular database backups
5. **Scaling**: Consider read replicas for high traffic
6. **Connection Pooling**: Use connection pooling at the application level

## License

MIT


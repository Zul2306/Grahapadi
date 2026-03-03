# Warehouse Project Setup Guide

Panduan lengkap untuk setup project Warehouse di mesin baru.

## Prerequisites

- **Go** 1.16+ ([Download](https://golang.org/dl/))
- **Node.js** 14+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Git**

## Setup Backend

### 1. Clone Repository

```bash
git clone <repository-url>
cd warehouse/backend
```

### 2. Setup Environment Variables

```bash
# Copy .env.example ke .env
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi lokal Anda:

```dotenv
APP_PORT=8080
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=inventory
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_BASE_URL=http://localhost:3000
```

**Pastikan PostgreSQL sudah running dan database `inventory` tidak perlu di-buat manual (akan dibuat oleh migration).**

### 3. Install Go Dependencies

```bash
go mod download
go mod tidy
```

### 4. Jalankan Database Migrations

Migration akan membuat semua tabel dan schema secara otomatis:

```bash
go run migrate.go
```

Output yang diharapkan:

```
.env file loaded successfully
✓ Connected to database successfully
Executing migration: 001_create_tables.sql
✓ Migration completed: 001_create_tables.sql
✓✓✓ All migrations completed successfully!
```

### 5. Jalankan Backend Server

```bash
go run main.go
```

Server akan running di `http://localhost:8080`

---

## Setup Frontend

### 1. Navigate ke Frontend Directory

```bash
cd warehouse/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Development Server

```bash
npm start
```

Frontend akan running di `http://localhost:3000`

---

## Database Schema

Migrations akan membuat tabel berikut secara otomatis:

- `users` - User management
- `products` - Product catalog
- `warehouses` - Warehouse management
- `warehouse_inventory` - Inventory per warehouse
- `stock_opnames` - Stock opname records
- `transactions` - Transaction history
- `password_reset_tokens` - Password reset tokens

Semua tabel sudah dilengkapi dengan:

- Foreign key constraints
- Cascade delete rules
- Indexes untuk optimasi query
- Timestamp fields (created_at, updated_at)

---

## Troubleshooting

### Error: Database "inventory" does not exist

**Solusi**: Pastikan PostgreSQL sudah running dan credentials di `.env` benar.

### Error: Connection refused

**Solusi**: Pastikan PostgreSQL server sudah running:

```bash
# Windows
net start PostgreSQL

# macOS (jika pakai Homebrew)
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Migration errors

**Solusi**: Cek file logs dan pastikan database credentials benar di `.env`

---

## Development

### Start Both Backend & Frontend

Di terminal terpisah:

**Terminal 1 (Backend):**

```bash
cd warehouse/backend
go run main.go
```

**Terminal 2 (Frontend):**

```bash
cd warehouse/frontend
npm start
```

Akses aplikasi di `http://localhost:3000`

Default credentials tergantung data yang ada di database setelah migration.

---

## Testing

### Test Backend API

```bash
cd backend
# Run migrations terlebih dahulu
go run migrate.go
# Kemudian start server
go run main.go
```

Gunakan tools seperti Postman atau cURL untuk test API endpoints.

### Test Frontend Build

```bash
cd frontend
npm run build
```

---

## Helpful Commands

```bash
# Reset database (hapus dan buat ulang - HATI-HATI!)
# 1. Drop database di PostgreSQL
# 2. Buat ulang database
createdb -U postgres inventory
# 3. Jalankan migrations lagi
go run migrate.go

# Check Go version
go version

# Check Node version
node --version
npm --version

# Check PostgreSQL version
psql --version
```

---

## Need Help?

Jika mengalami masalah saat setup, silahkan:

1. Cek file `.env` sudah sesuai dengan PostgreSQL credentials
2. Pastikan semua tools sudah terinstall dengan versi yang tepat
3. Cek error messages di terminal output
4. Hubungi team lead untuk bantuan

---

**Happy Coding! 🚀**

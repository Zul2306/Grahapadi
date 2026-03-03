# Warehouse Management System

Sistem manajemen gudang terintegrasi dengan backend Go/PostgreSQL dan frontend React.

## 📋 Project Structure

```
warehouse/
├── backend/          # Go API server & database migrations
├── frontend/         # React web application
├── SETUP.md         # Panduan setup lengkap untuk developer baru
└── README.md        # File ini
```

## 🚀 Quick Start

**Untuk setup pertama kali, baca [SETUP.md](SETUP.md)**

Quick commands:

```bash
# Backend setup
cd backend
cp .env.example .env
go mod download
go run migrate.go
go run main.go

# Frontend setup (terminal baru)
cd frontend
npm install
npm start
```

Backend: `http://localhost:8080`  
Frontend: `http://localhost:3000`

## 🗄️ Database

Menggunakan **PostgreSQL** dengan **GORM** ORM.

Database migrations otomatis membuat:
- Users & authentication
- Products & inventory
- Warehouses & stock management
- Transactions & history
- Stock opname records

```bash
# Run migrations (membuat semua tabel)
cd backend
go run migrate.go
```

## 🛠️ Tech Stack

**Backend:**
- Go 1.16+
- Gin Web Framework
- PostgreSQL
- GORM ORM
- JWT Authentication

**Frontend:**
- React 18+
- Tailwind CSS
- Context API
- React Router

## 📁 Key Files

- [backend/migrate.go](backend/migrate.go) - Database migration runner
- [backend/migrations/001_create_tables.sql](backend/migrations/001_create_tables.sql) - Database schema
- [backend/config/database.go](backend/config/database.go) - Database config
- [frontend/src/context/AuthContext.js](frontend/src/context/AuthContext.js) - Auth context
- [frontend/src/pages/](frontend/src/pages/) - Main application pages

## 📝 Features

- ✅ User authentication & role-based access
- ✅ Product & inventory management
- ✅ Warehouse management
- ✅ Stock opname tracking
- ✅ Transaction history
- ✅ Advanced filtering & reporting
- ✅ Responsive UI with Tailwind CSS

## 🔐 Security

- JWT token-based authentication
- Password hashing
- CORS middleware
- Role-based access control (RBAC)
- Environment variables for sensitive data

## 📖 Documentation

Lihat [SETUP.md](SETUP.md) untuk:
- Prerequisites & installation
- Environment setup
- Running migrations
- Troubleshooting

## 🤝 Contributing

1. Clone repository
2. Buat feature branch: `git checkout -b feature/nama-fitur`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Submit pull request

## 📞 Support

Jika ada pertanyaan atau masalah, hubungi team lead.

---

**Happy Coding! 🎯**

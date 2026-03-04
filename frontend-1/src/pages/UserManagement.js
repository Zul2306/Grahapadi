import React, { useState, useEffect } from "react";

const roleColors = {
  Admin: "bg-purple-100 text-purple-700",
  Manager: "bg-blue-100 text-blue-700",
  Operator: "bg-emerald-100 text-emerald-700",
  Viewer: "bg-gray-100 text-gray-600",
};

const statusColors = {
  Active: "text-emerald-600",
  Inactive: "text-red-500",
  pending: "text-amber-600",
  active: "text-emerald-600",
  inactive: "text-red-500",
};

const statusDot = {
  Active: "bg-emerald-500",
  Inactive: "bg-red-400",
  pending: "bg-amber-400",
  active: "bg-emerald-500",
  inactive: "bg-red-400",
};

const statusLabel = {
  pending: "Pending",
  active: "Active",
  inactive: "Inactive",
};

const initUsers = [
  {
    id: 1,
    nama: "alexrivera",
    name: "Alex Rivera",
    email: "alex@warehouse.com",
    role: "Admin",
    status: "active",
    joined: "Jan 12, 2023",
    avatar: "AR",
  },
  {
    id: 2,
    nama: "sarahjohn",
    name: "Sarah Johnson",
    email: "sarah@warehouse.com",
    role: "Manager",
    status: "active",
    joined: "Mar 5, 2023",
    avatar: "SJ",
  },
  {
    id: 3,
    nama: "miketorres",
    name: "Mike Torres",
    email: "mike@warehouse.com",
    role: "Operator",
    status: "active",
    joined: "Jun 19, 2023",
    avatar: "MT",
  },
  {
    id: 4,
    nama: "lindakim",
    name: "Linda Kim",
    email: "linda@warehouse.com",
    role: "Viewer",
    status: "inactive",
    joined: "Aug 2, 2023",
    avatar: "LK",
  },
  {
    id: 5,
    nama: "jamespatel",
    name: "James Patel",
    email: "james@warehouse.com",
    role: "Operator",
    status: "active",
    joined: "Sep 14, 2023",
    avatar: "JP",
  },
];

const avatarGradients = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-red-500 to-rose-500",
];

export default function UserManagement() {
  const [users, setUsers] = useState(initUsers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ nama: "", nama_lengkap: "", email: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/users", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success && result.data) {
        // Normalize API data to match UI expectations
        const normalizedUsers = result.data.map((user) => ({
          ...user,
          name: user.nama_lengkap || user.name,
          avatar: (user.nama_lengkap || user.name || "")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
          joined:
            user.joined ||
            user.created_at ||
            new Date().toLocaleString("id-ID", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
        }));
        setUsers(normalizedUsers);
      } else {
        setUsers(initUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers(initUsers);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.role && u.role.toLowerCase().includes(search.toLowerCase())) ||
      (u.nama && u.nama.toLowerCase().includes(search.toLowerCase())),
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.nama || !form.nama_lengkap || !form.email) {
      setFormError("Nama, Nama Lengkap, dan Email harus diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/auth/create-user-invitation",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            nama: form.nama,
            nama_lengkap: form.nama_lengkap,
            email: form.email,
            role: "Staff",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setFormError(
          result.message || "Gagal membuat user. Silakan coba lagi.",
        );
        setIsLoading(false);
        return;
      }

      // Add user to local state with pending status
      const initials = form.nama_lengkap
        .trim()
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      setUsers([
        ...users,
        {
          id: result.data.id,
          nama: form.nama,
          name: form.nama_lengkap,
          email: form.email,
          role: "Staff",
          status: "pending",
          joined: new Date().toLocaleString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          avatar: initials,
        },
      ]);

      setFormSuccess(
        `✓ User berhasil dibuat! Email undangan telah dikirim ke ${form.email}`,
      );
      setForm({ nama: "", nama_lengkap: "", email: "" });

      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
      }, 2000);
    } catch (error) {
      setFormError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Error creating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteError("");
    setDeleteSuccess("");
    setIsDeleting(true);

    try {
      const response = await fetch(`http://localhost:8080/api/v1/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        setDeleteError(
          result.message || "Gagal menghapus user. Silakan coba lagi.",
        );
        setIsDeleting(false);
        return;
      }

      // Remove from local state
      setUsers(users.filter((u) => u.id !== id));
      setDeleteSuccess("✓ User berhasil dihapus!");

      setTimeout(() => {
        setConfirmDelete(null);
        setDeleteSuccess("");
      }, 1500);
    } catch (error) {
      setDeleteError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 flex-1 min-w-0 ml-10 lg:ml-0">
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            className="bg-transparent text-sm text-gray-600 outline-none min-w-0 flex-1 placeholder-gray-400"
            placeholder="Cari pengguna berdasarkan nama, email, atau peran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setFormError("");
            setFormSuccess("");
            setForm({ nama: "", nama_lengkap: "", email: "" });
          }}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Pengguna
        </button>
      </header>

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mengelola pengguna sistem, role, dan izin akses.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Total Pengguna",
              value: users.length,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Aktif",
              value: users.filter((u) => u.status === "active").length,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Tertunda",
              value: users.filter((u) => u.status === "pending").length,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Admin",
              value: users.filter((u) => u.role === "Admin").length,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`${stat.bg} rounded-xl p-2.5`}>
                <svg
                  className={`w-5 h-5 ${stat.color}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">
                  {stat.label}
                </p>
                <p className={`text-2xl font-black ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Peran
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-sm text-gray-400"
                    >
                      Tidak ada pengguna yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, i) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-xs font-bold text-white">
                              {user.avatar}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {user.name || user.nama_lengkap}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[user.status]}`}
                          />
                          <span
                            className={`text-sm font-medium ${statusColors[user.status]}`}
                          >
                            {statusLabel[user.status] || user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setConfirmDelete(user);
                            setDeleteError("");
                            setDeleteSuccess("");
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Menampilkan{" "}
              <span className="font-semibold text-gray-700">
                {filtered.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-700">
                {users.length}
              </span>{" "}
              pengguna
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span>© 2024 Sistem Inventaris Terpadu • V2.6.0</span>
        <div className="flex items-center gap-4">
          <a href="#!" className="hover:text-gray-700 uppercase tracking-wide">
            Dokumentasi
          </a>
          <a href="#!" className="hover:text-gray-700 uppercase tracking-wide">
           Status Sistem
          </a>
        </div>
      </footer>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Tambah User Baru
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg
                    className="w-4 h-4 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <svg
                    className="w-4 h-4 text-emerald-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-emerald-600">{formSuccess}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Nama (Username)
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="john.doe"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={form.nama_lengkap}
                  onChange={(e) =>
                    setForm({ ...form, nama_lengkap: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="john@warehouse.com"
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Mengirim..." : "Buat User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setConfirmDelete(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Hapus Pengguna
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-gray-900">
                {confirmDelete.name || confirmDelete.nama_lengkap}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-left">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}

            {deleteSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-left">
                <svg
                  className="w-4 h-4 text-emerald-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-emerald-600">{deleteSuccess}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => !isDeleting && setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isDeleting ? "Menghapus..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

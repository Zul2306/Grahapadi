import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { hasPermission, PERMISSIONS, isStaff } from "../utils/permissions";
import AdvancedFilterModal from "../components/AdvancedFilterModal";
import { searchAndFilter } from "../utils/filterHelpers";

export default function StockOpname() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    product_id: "",
    user_id: "",
    stok_sistem: 0,
    stok_fisik: "",
    catatan: "",
    is_adjusted: false,
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filters, setFilters] = useState({
    product_id: "",
    user_id: "",
    is_adjusted: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    Promise.all([
      fetchStockOpnames(),
      fetchProducts(),
      fetchWarehouses(),
      fetchUsers(),
    ]);
  }, []);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const fetchStockOpnames = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/stock-opnames",
      );
      const result = await response.json();
      if (result.success) {
        setRecords(result.data || []);
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Gagal memuat data stock opname: " + err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/products");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (_) {}
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/warehouses");
      const result = await response.json();
      if (result.success) {
        setWarehouses(result.data || []);
      }
    } catch (_) {}
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/users");
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (_) {}
  };

  const fetchSystemStock = async (productId) => {
    if (!productId) {
      setFormData((prev) => ({ ...prev, stok_sistem: 0 }));
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/stock-opnames/system-stock?warehouse_id=1&product_id=${productId}`,
      );
      const result = await response.json();
      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          stok_sistem: result.data.stok_sistem || 0,
        }));
      }
    } catch (_) {
      setFormData((prev) => ({ ...prev, stok_sistem: 0 }));
    }
  };

  const getProductName = (id) => {
    const product = products.find((item) => item.id === id);
    return product ? product.nama_barang : `Product ${id}`;
  };

  const getWarehouseName = (id) => {
    const warehouse = warehouses.find((item) => item.id === id);
    return warehouse ? warehouse.nama_gudang : `Warehouse ${id}`;
  };

  const getUserName = (id) => {
    const user = users.find((item) => item.id === id);
    return user ? user.nama_lengkap || user.email : `User ${id}`;
  };

  // Transform data for filtering display
  const recordsWithNames = records.map((r) => ({
    ...r,
    product_name: getProductName(r.product_id),
    user_name: getUserName(r.user_id),
    is_adjusted_text: r.is_adjusted ? "Ya" : "Tidak",
  }));

  // Calculate active filter count
  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "",
  ).length;

  // Apply filters with searchAndFilter utility
  const filteredData = searchAndFilter(
    recordsWithNames,
    search,
    ["product_name", "user_name", "catatan"],
    {
      product_id: filters.product_id,
      user_id: filters.user_id,
      is_adjusted: filters.is_adjusted,
    },
    {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      dateField: "timestamp",
    },
  );

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Calculate pending count
  const pendingCount = records.filter((r) => r.status === "pending").length;

  const formSelisih = useMemo(() => {
    const fisik = Number(formData.stok_fisik || 0);
    return fisik - Number(formData.stok_sistem || 0);
  }, [formData.stok_fisik, formData.stok_sistem]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      product_id: "",
      pengguna_id: user?.id?.toString() || "", // Auto-fill with logged-in user
      stok_sistem: 0,
      stok_fisik: "",
      catatan: "",
      is_adjusted: false,
    });
    setProductSearch("");
    setShowProductDropdown(false);
    setShowModal(true);
  };

  const openEditModal = async (record) => {
    setEditingId(record.id);
    setFormData({
      product_id: String(record.product_id),
      user_id: String(record.user_id),
      stok_sistem: record.stok_sistem || 0,
      stok_fisik: String(record.stok_fisik),
      catatan: record.catatan || "",
      is_adjusted: !!record.is_adjusted,
    });

    // Set product search display name
    const product = products.find((p) => p.id === record.product_id);
    if (product) {
      setProductSearch(product.nama_barang);
    }

    setShowProductDropdown(false);
    setShowModal(true);
    await fetchSystemStock(record.product_id);
  };

  const handleFormChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;

    const nextForm = {
      ...formData,
      [name]: nextValue,
    };
    setFormData(nextForm);

    if (name === "product_id") {
      await fetchSystemStock(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_id || !formData.user_id) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Product dan User wajib diisi",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (formData.stok_fisik === "" || Number(formData.stok_fisik) < 0) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Stok fisik harus angka 0 atau lebih",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `http://localhost:8080/api/v1/stock-opnames/${editingId}`
        : "http://localhost:8080/api/v1/stock-opnames";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        product_id: Number(formData.product_id),
        warehouse_id: 1,
        user_id: Number(formData.user_id),
        stok_fisik: Number(formData.stok_fisik),
        catatan: formData.catatan,
        is_adjusted: !!formData.is_adjusted,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Gagal menyimpan stock opname");
      }

      await fetchStockOpnames();
      setShowModal(false);
      setProductSearch("");
      setShowProductDropdown(false);

      Swal.fire({
        title: "Berhasil",
        text: editingId
          ? "Stock opname berhasil diperbarui"
          : "Stock opname berhasil dibuat",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      Swal.fire({
        title: "Gagal",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus data?",
      text: "Data stock opname akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/stock-opnames/${id}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal menghapus data");
      }

      await fetchStockOpnames();
      Swal.fire({
        title: "Berhasil",
        text: "Data stock opname berhasil dihapus",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      Swal.fire({
        title: "Gagal",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/stock-opnames/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengubah status");
      }

      await fetchStockOpnames();
      Swal.fire({
        title: "Berhasil",
        text: `Status berhasil diubah menjadi ${newStatus}`,
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });
    } catch (err) {
      Swal.fire({
        title: "Gagal",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
        <div className="pl-10 lg:pl-0">
          <h1 className="text-2xl font-bold text-gray-900">Stock Opname</h1>
          <p className="text-sm text-gray-500">
            CRUD data stock opname per barang dan gudang.
          </p>
        </div>
        {pendingCount > 0 && !isStaff(user?.role) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
            <svg
              className="w-4 h-4 text-orange-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-orange-900">
              {pendingCount} Pending
            </span>
          </div>
        )}
        <button
          onClick={() => setShowFilterModal(true)}
          className="relative flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors ml-auto"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {hasPermission(user?.role, PERMISSIONS.STOCK_OPNAME_CREATE) && (
          <button
            onClick={openCreateModal}
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
          >
            Tambah Stock Opname
          </button>
        )}
      </header>

      <div className="flex-1 p-4 sm:p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 flex-1 max-w-md">
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
              className="bg-transparent text-sm text-gray-600 outline-none flex-1 placeholder-gray-400"
              placeholder="Cari produk, pengguna, atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 relative">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Rentang Waktu
          </label>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-gray-900">
              {filters.dateFrom || filters.dateTo
                ? `${filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString("id-ID") : "Dari"} — ${filters.dateTo ? new Date(filters.dateTo).toLocaleDateString("id-ID") : "Sampai"}`
                : "Pilih Rentang Waktu"}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${showDatePicker ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-80 sm:w-96">
              <div className="space-y-4">
                {/* From Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, dateFrom: "", dateTo: "" });
                      setShowDatePicker(false);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Bersih
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    No
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Barang
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Stok Sistem
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Stok Fisik
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Selisih
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Catatan
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  {!isStaff(user?.role) && (
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td
                      className="px-5 py-4 text-center text-gray-500"
                      colSpan={isStaff(user?.role) ? "9" : "10"}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-4 text-center text-gray-500"
                      colSpan={isStaff(user?.role) ? "9" : "10"}
                    >
                      Belum ada data stock opname
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {getProductName(row.product_id)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {getUserName(row.user_id)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {row.stok_sistem}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {row.stok_fisik}
                      </td>
                      <td
                        className={`px-5 py-4 text-sm font-semibold ${row.selisih < 0 ? "text-red-600" : row.selisih > 0 ? "text-emerald-600" : "text-gray-700"}`}
                      >
                        {row.selisih > 0 ? "+" : ""}
                        {row.selisih}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        <span title={row.catatan || "-"}>
                          {row.catatan
                            ? row.catatan.substring(0, 30) +
                              (row.catatan.length > 30 ? "..." : "")
                            : "-"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {row.timestamp
                          ? new Date(row.timestamp).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              row.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {row.status === "approved" ? (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {row.status === "approved" ? "Approved" : "Pending"}
                          </span>
                          {row.status === "pending" && !isStaff(user?.role) && (
                            <button
                              onClick={() => changeStatus(row.id, "approved")}
                              className="px-2 py-1 rounded text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              Setujui
                            </button>
                          )}
                        </div>
                      </td>
                      {!isStaff(user?.role) && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(row)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Menampilkan{" "}
              <span className="font-semibold text-gray-900">
                {filteredData.length > 0 ? startIndex + 1 : 0}
              </span>{" "}
              ke{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(startIndex + itemsPerPage, filteredData.length)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900">
                {filteredData.length}
              </span>{" "}
              item
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-sm font-medium text-gray-700">
                Halaman {currentPage} dari {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        data={recordsWithNames}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        columnFilters={[
          { key: "product_id", label: "Produk" },
          { key: "user_id", label: "User" },
          { key: "is_adjusted_text", label: "Status Adjusted" },
        ]}
        showDateRange={false}
        dateField="created_at"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Stock Opname" : "Tambah Stock Opname"}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Barang
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari atau pilih barang..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                  {showProductDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-xl bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                      {products
                        .filter((item) =>
                          item.nama_barang
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={async () => {
                              setFormData({
                                ...formData,
                                product_id: String(item.id),
                              });
                              setProductSearch(item.nama_barang);
                              setShowProductDropdown(false);
                              await fetchSystemStock(item.id);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700"
                          >
                            {item.nama_barang}
                          </div>
                        ))}
                      {products.filter((item) =>
                        item.nama_barang
                          .toLowerCase()
                          .includes(productSearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Tidak ada barang yang cocok
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pengguna{" "}
                  {!editingId && (
                    <span className="text-xs text-gray-500">
                      (Terisi Otomatis)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    formData.user_id
                      ? users.find((u) => u.id === Number(formData.user_id))
                          ?.nama_lengkap ||
                        users.find((u) => u.id === Number(formData.user_id))
                          ?.email ||
                        ""
                      : ""
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-gray-50 cursor-not-allowed opacity-75"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stok Sistem (otomatis)
                  </label>
                  <input
                    type="text"
                    value={formData.stok_sistem}
                    readOnly
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stok Fisik
                  </label>
                  <input
                    type="text"
                    min="0"
                    name="stok_fisik"
                    value={formData.stok_fisik}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700">
                Selisih:{" "}
                <span className="font-semibold">
                  {formSelisih > 0 ? "+" : ""}
                  {formSelisih}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="is_adjusted"
                  checked={formData.is_adjusted}
                  onChange={handleFormChange}
                />
                Tandai sebagai adjusted
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingId
                      ? "Update"
                      : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

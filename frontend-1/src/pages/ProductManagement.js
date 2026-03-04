import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { hasPermission, PERMISSIONS, isStaff } from "../utils/permissions";
import AdvancedFilterModal from "../components/AdvancedFilterModal";
import { searchAndFilter } from "../utils/filterHelpers";

export default function ProductManagement() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    jenis_barang: "",
    status: "",
    ukuran_kg: "",
  });
  const [formData, setFormData] = useState({
    kode_barang: "",
    nama_barang: "",
    jenis_barang: "medium",
    ukuran_kg: "",
    stok_minimal: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get status dari data
  const getProductStatus = (actualStock, stokMinimal) => {
    if (actualStock === 0) return "Out of Stock";
    if (actualStock < stokMinimal) return "Low Stock";
    return "In Stock";
  };

  const getTotalStockByProduct = (productId) => {
    const inventories = warehouseInventory.filter(
      (inv) => inv.product_id === productId,
    );
    return inventories.reduce((total, inv) => total + (inv.stok || 0), 0);
  };

  const dataWithStatus = products.map((p) => {
    const actualStock = getTotalStockByProduct(p.id);
    return {
      ...p,
      status: getProductStatus(actualStock, p.stok_minimal),
    };
  });

  // Apply search + filters
  const filteredData = searchAndFilter(
    dataWithStatus,
    search,
    ["nama_barang", "kode_barang"],
    filters,
  );

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== "",
  ).length;

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  useEffect(() => {
    fetchProducts();
    fetchWarehouseInventory();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/products");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to fetch products: " + err.message);
    }
    setLoading(false);
  };

  const fetchWarehouseInventory = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/warehouse-inventory",
      );
      const result = await response.json();
      if (result.success) {
        setWarehouseInventory(result.data || []);
      }
    } catch (err) {
      console.log("Failed to fetch warehouse inventory");
    }
  };

  const deleteProduct = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Product?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/products/${id}`,
        {
          method: "DELETE",
        },
      );
      const resultData = await response.json();
      if (resultData.success) {
        setProducts(products.filter((p) => p.id !== id));
        Swal.fire({
          title: "Berhasil!",
          text: "Product berhasil dihapus",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Gagal!",
          text: resultData.message || "Gagal menghapus product",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Gagal menghapus product: " + err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const handleAddClick = () => {
    // Generate kode otomatis
    const lastDigit = Math.floor(Math.random() * 900) + 100;
    const autoCode = `BRG-${String(products.length + 1).padStart(3, "0")}`;

    setFormData({
      kode_barang: autoCode,
      nama_barang: "",
      jenis_barang: "medium",
      ukuran_kg: "",
      stok_minimal: "",
    });
    setFormError("");
    setEditingId(null);
    setShowAddModal(true);
  };

  const handleEditClick = (product) => {
    setFormData({
      kode_barang: product.kode_barang,
      nama_barang: product.nama_barang,
      jenis_barang: product.jenis_barang,
      ukuran_kg: product.ukuran_kg,
      stok_minimal: product.stok_minimal,
    });
    setFormError("");
    setEditingId(product.id);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nama_barang.trim()) {
      setFormError("Nama Barang is required");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Nama Barang harus diisi",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    if (!formData.ukuran_kg) {
      setFormError("Ukuran (kg) is required");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Ukuran (kg) harus diisi",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    if (!formData.stok_minimal && formData.stok_minimal !== 0) {
      setFormError("Stok Minimal is required");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Stok Minimal harus diisi",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `http://localhost:8080/api/v1/products/${editingId}`
        : "http://localhost:8080/api/v1/products";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kode_barang: formData.kode_barang.trim(),
          nama_barang: formData.nama_barang.trim(),
          jenis_barang: formData.jenis_barang,
          ukuran_kg: parseFloat(formData.ukuran_kg),
          stok_minimal: parseInt(formData.stok_minimal),
        }),
      });
      const result = await response.json();

      if (result.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        setFormData({
          kode_barang: "",
          nama_barang: "",
          jenis_barang: "medium",
          ukuran_kg: "",
          stok_minimal: "",
        });
        setEditingId(null);
        fetchProducts(); // Refresh the list
        setError(""); // Clear any previous errors

        // Success alert
        Swal.fire({
          title: "Berhasil!",
          text: editingId
            ? "Product berhasil diperbarui"
            : "Product berhasil ditambahkan",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        setFormError(result.message || "Failed to save product");
        Swal.fire({
          title: "Gagal!",
          text: result.message || "Gagal menyimpan product",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      setFormError("Failed to save product: " + err.message);
      Swal.fire({
        title: "Error!",
        text: "Gagal menyimpan product: " + err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
    setSubmitting(false);
  };

  const getStockStatus = (actualStock, stokMinimal) => {
    if (actualStock === 0) {
      return {
        status: "Out of Stock",
        statusColor: "text-red-600",
        dotColor: "bg-red-500",
      };
    } else if (actualStock < stokMinimal) {
      // Low Stock: stok kurang dari stok minimal
      // Contoh: stok_minimal=200, low stock jika stok 1-199 unit
      return {
        status: "Low Stock",
        statusColor: "text-amber-600",
        dotColor: "bg-amber-500",
      };
    }
    return {
      status: "In Stock",
      statusColor: "text-emerald-600",
      dotColor: "bg-emerald-500",
    };
  };

  const getJenisColor = (jenis) => {
    switch (jenis.toLowerCase()) {
      case "premium":
        return "bg-purple-100 text-purple-700";
      case "medium":
        return "bg-blue-100 text-blue-700";
      case "super":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filtered = products.filter(
    (p) =>
      p.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
      p.kode_barang.toLowerCase().includes(search.toLowerCase()),
  );

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
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="relative flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
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
        <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Ekspor
        </button>
        {hasPermission(user?.role, PERMISSIONS.PRODUCT_CREATE) && (
          <button
            onClick={handleAddClick}
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
            Tambah Produk
          </button>
        )}
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
      </header>

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Manajemen Produk
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan lacak detail katalog inventaris Anda dengan pembaruan waktu nyata.
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    No
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Info Produk
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Kode Barang
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Jenis
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Ukuran (kg)
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Stok Minimal
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
                      colSpan={isStaff(user?.role) ? "7" : "8"}
                      className="px-5 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isStaff(user?.role) ? "7" : "8"}
                      className="px-5 py-4 text-center text-gray-500"
                    >
                      Tidak ada produk ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((p, index) => {
                    const actualStock = getTotalStockByProduct(p.id);
                    const { status, statusColor, dotColor } = getStockStatus(
                      actualStock,
                      p.stok_minimal,
                    );
                    const jenisColor = getJenisColor(p.jenis_barang);
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {p.nama_barang}
                            </p>
                            <p className="text-xs text-gray-400">
                              {p.kode_barang}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 font-mono">
                          {p.kode_barang}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${jenisColor}`}
                          >
                            {p.jenis_barang}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {p.ukuran_kg} kg
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 hidden lg:table-cell">
                          {actualStock} / {p.stok_minimal} units
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
                            />
                            <span
                              className={`text-sm font-medium ${statusColor}`}
                            >
                              {status}
                            </span>
                          </div>
                        </td>
                        {!isStaff(user?.role) && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
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
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredData.length > 0 ? startIndex + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(startIndex + itemsPerPage, filteredData.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {filteredData.length}
              </span>{" "}
              items
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
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Berikutnya
              </button>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        data={dataWithStatus}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        columnFilters={[
          { key: "jenis_barang", label: "Jenis Barang" },
          { key: "status", label: "Status", type: "select" },
          { key: "ukuran_kg", label: "Ukuran (kg)" },
        ]}
        showDateRange={false}
      />

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
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

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Kode Barang */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kode Barang
                </label>
                <input
                  type="text"
                  name="kode_barang"
                  value={formData.kode_barang}
                  onChange={handleFormChange}
                  placeholder="Auto-generated"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  readOnly
                />
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  name="nama_barang"
                  value={formData.nama_barang}
                  onChange={handleFormChange}
                  placeholder="e.g., Product Name"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Jenis Barang */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jenis Barang *
                </label>
                <select
                  name="jenis_barang"
                  value={formData.jenis_barang}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="premium">Premium</option>
                  <option value="medium">Medium</option>
                  <option value="super">Super</option>
                </select>
              </div>

              {/* Ukuran KG */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ukuran (kg) *
                </label>
                <input
                  type="text"
                  name="ukuran_kg"
                  value={formData.ukuran_kg}
                  onChange={handleFormChange}
                  placeholder="e.g., 2.5"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Stok Minimal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stok Minimal *
                </label>
                <input
                  type="text"
                  name="stok_minimal"
                  value={formData.stok_minimal}
                  onChange={handleFormChange}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
              >
                {submitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update Product"
                    : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <span>© 2024 Integrated Inventory System • V2.6.0</span>
        <div className="flex items-center gap-4">
          <a href="#!" className="hover:text-gray-700 uppercase tracking-wide">
            Documentation
          </a>
          <a href="#!" className="hover:text-gray-700 uppercase tracking-wide">
            System Status
          </a>
          <a href="#!" className="hover:text-gray-700 uppercase tracking-wide">
            Support Hub
          </a>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { hasPermission, PERMISSIONS, isStaff } from "../utils/permissions";
import AdvancedFilterModal from "../components/AdvancedFilterModal";
import { searchAndFilter } from "../utils/filterHelpers";

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [warehouseCapacities, setWarehouseCapacities] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    product_id: "",
    warehouse_id: "",
    penanggung_jawab: "",
    type: "",
    jumlah: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedWarehouseCapacity, setSelectedWarehouseCapacity] =
    useState(null);
  const [selectedProductWeight, setSelectedProductWeight] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    warehouse_id: "",
    penanggung_jawab: "",
    product_id: "",
    dateFrom: "",
    dateTo: "",
  });

  // Fetch all data on mount
  useEffect(() => {
    fetchTransactions();
    fetchProducts();
    fetchWarehouses();
    fetchUsers();
    fetchWarehouseCapacities();
  }, []);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/transactions");
      const result = await response.json();
      if (result.success) {
        setTransactions(result.data || []);
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Gagal memuat transaksi: " + err.message,
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
      if (result.success && result.data) {
        setProducts(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        setProducts(result);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setProducts([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/warehouses");
      const result = await response.json();
      if (result.success && result.data) {
        setWarehouses(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        setWarehouses(result);
      } else {
        setWarehouses([]);
      }
    } catch (err) {
      setWarehouses([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/users");
      const result = await response.json();
      if (result.success && result.data) {
        setUsers(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        setUsers(result);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setUsers([]);
    }
  };

  const fetchWarehouseCapacities = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/warehouses/capacity/status",
      );
      const result = await response.json();
      if (result.success && result.data) {
        // Create a map of warehouse_id to capacity info (weight-based)
        const capacityMap = {};
        result.data.forEach((cap) => {
          capacityMap[cap.warehouse_id] = {
            total_kapasitas_kg: cap.total_kapasitas_kg,
            total_berat_kg: cap.total_berat_kg,
            available_capacity_kg: cap.available_capacity_kg,
            usage_percent: cap.usage_percent,
            total_unit_count: cap.total_unit_count,
          };
        });
        setWarehouseCapacities(capacityMap);
      }
    } catch (err) {
      return;
    }
  };

  const recalculateInventory = async () => {
    const confirm = await Swal.fire({
      title: "Hitung Ulang Inventory?",
      text: "Ini akan me-reset stok gudang berdasarkan data transaksi yang ada",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hitung Ulang",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/warehouses/Hitung Ulang-inventory",
        {
          method: "POST",
        },
      );
      const result = await response.json();
      if (result.success) {
        await fetchWarehouseCapacities();
        Swal.fire({
          title: "Berhasil!",
          text: `Inventory berhasil di-Hitung Ulang. ${result.updated_records} record diperbarui.`,
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Gagal!",
          text: result.message || "Gagal Hitung Ulang inventory",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Gagal Hitung Ulang inventory: " + err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const handleAddClick = () => {
    setFormData({
      product_id: "",
      warehouse_id: "",
      penanggung_jawab: user?.id?.toString() || "", // Auto-fill with logged-in user
      type: "masuk", // Default to "masuk" (incoming)
      jumlah: "",
    });
    setFormError("");
    setEditingId(null);
    setSelectedWarehouseCapacity(null);
    setSelectedProductWeight(null);
    setProductSearch("");
    setShowProductDropdown(false);
    setShowModal(true);
  };

  const handleEditClick = (transaction) => {
    setFormData({
      product_id: transaction.product_id.toString(),
      warehouse_id: transaction.warehouse_id.toString(),
      penanggung_jawab: transaction.penanggung_jawab,
      type: transaction.type,
      jumlah: transaction.jumlah.toString(),
    });
    setFormError("");
    setEditingId(transaction.id);

    // Load capacity for the warehouse being edited
    const capacity = warehouseCapacities[transaction.warehouse_id];
    setSelectedWarehouseCapacity(capacity);

    // Load product weight for the product being edited
    const product = products.find((p) => p.id === transaction.product_id);
    if (product) {
      setSelectedProductWeight({
        product_id: product.id,
        nama_barang: product.nama_barang,
        ukuran_kg: product.ukuran_kg || 0,
      });
      setProductSearch(product.nama_barang);
    }

    setShowProductDropdown(false);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormError("");

    // Update warehouse capacity when warehouse is selected
    if (name === "warehouse_id" && value) {
      const capacity = warehouseCapacities[value];
      setSelectedWarehouseCapacity(capacity);
    } else if (name === "warehouse_id") {
      setSelectedWarehouseCapacity(null);
    }

    // Fetch product weight when product is selected
    if (name === "product_id" && value) {
      const product = products.find((p) => p.id == value);
      if (product) {
        setSelectedProductWeight({
          product_id: product.id,
          nama_barang: product.nama_barang,
          ukuran_kg: product.ukuran_kg || 0,
        });
      }
    } else if (name === "product_id") {
      setSelectedProductWeight(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const effectivePenanggungJawab =
      formData.penanggung_jawab || user?.id?.toString() || "";

    // Validation
    if (!formData.product_id) {
      setFormError("Product harus diisi");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Product harus diisi",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    // Warehouse is optional for "keluar" - will auto-select based on usage
    if (!formData.warehouse_id && formData.type === "masuk") {
      setFormError("Warehouse harus diisi untuk transaksi masuk");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Warehouse harus diisi untuk transaksi masuk",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    if (!effectivePenanggungJawab) {
      setFormError("Penanggung Jawab harus diisi");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Penanggung Jawab harus diisi",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    if (!formData.jumlah || formData.jumlah <= 0) {
      setFormError("Jumlah harus lebih dari 0");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Jumlah harus lebih dari 0",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    if (!formData.type) {
      setFormError("Type harus dipilih");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Pilih Masuk atau Keluar",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const productIdNum = Number(formData.product_id);
    const penanggungJawabNum = Number(effectivePenanggungJawab);
    const jumlahNum = Number(formData.jumlah);

    if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
      setFormError("Product invalid");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Product invalid. Silakan pilih produk lagi.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!Number.isInteger(penanggungJawabNum) || penanggungJawabNum <= 0) {
      setFormError("Penanggung Jawab invalid");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Penanggung Jawab invalid. Silakan login ulang.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!Number.isInteger(jumlahNum) || jumlahNum <= 0) {
      setFormError("Jumlah harus berupa angka positif");
      Swal.fire({
        title: "Validasi Gagal!",
        text: "Jumlah harus berupa angka positif",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    // Check capacity for incoming transactions (weight-based)
    if (
      formData.type === "masuk" &&
      selectedWarehouseCapacity &&
      selectedProductWeight
    ) {
      const requestedUnits = jumlahNum;
      const unitWeightKg = selectedProductWeight.ukuran_kg || 0;
      const requestedWeightKg = requestedUnits * unitWeightKg;
      const availableCapacityKg =
        selectedWarehouseCapacity.available_capacity_kg;

      if (requestedWeightKg > availableCapacityKg) {
        setFormError(
          `Kapasitas tidak cukup. Tersedia: ${availableCapacityKg.toFixed(2)} kg`,
        );
        Swal.fire({
          title: "Kapasitas Gudang Tidak Cukup!",
          html: `
            <div style="text-align: left;">
              <p><strong>Total Kapasitas:</strong> ${selectedWarehouseCapacity.total_kapasitas_kg} kg</p>
              <p><strong>Berat Saat Ini:</strong> ${selectedWarehouseCapacity.total_berat_kg.toFixed(2)} kg</p>
              <p><strong>Kapasitas Tersedia:</strong> ${availableCapacityKg.toFixed(2)} kg</p>
              <hr/>
              <p><strong>Produk:</strong> ${selectedProductWeight.nama_barang}</p>
              <p><strong>Berat Per Unit:</strong> ${unitWeightKg} kg</p>
              <p><strong>Jumlah Permintaan:</strong> ${requestedUnits} unit</p>
              <p><strong>Total Berat Permintaan:</strong> ${requestedWeightKg.toFixed(2)} kg</p>
              <p style="color: red; margin-top: 10px;"><strong>⚠️ Berat melebihi kapasitas yang tersedia!</strong></p>
            </div>
          `,
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `http://localhost:8080/api/v1/transactions/${editingId}`
        : "http://localhost:8080/api/v1/transactions";
      const method = editingId ? "PUT" : "POST";

      // Prepare payload
      const payload = {
        product_id: productIdNum,
        penanggung_jawab: penanggungJawabNum,
        type: formData.type,
        jumlah: jumlahNum,
      };

      // For incoming (masuk), warehouse_id is required
      // For outgoing (keluar), warehouse_id can be 0 (auto-select)
      if (
        formData.type === "masuk" ||
        (formData.warehouse_id && formData.warehouse_id !== "")
      ) {
        const warehouseIdNum = Number(formData.warehouse_id);
        if (!Number.isInteger(warehouseIdNum) || warehouseIdNum <= 0) {
          if (formData.type === "masuk") {
            setFormError("Warehouse invalid");
            Swal.fire({
              title: "Validasi Gagal!",
              text: "Warehouse invalid. Silakan pilih warehouse lagi.",
              icon: "warning",
              confirmButtonColor: "#3b82f6",
            });
            setSubmitting(false);
            return;
          }
        } else {
          payload.warehouse_id = warehouseIdNum;
        }
      } else {
        payload.warehouse_id = 0; // Auto-select for keluar
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        setFormData({
          product_id: "",
          warehouse_id: "",
          penanggung_jawab: "",
          type: "",
          jumlah: "",
        });
        setEditingId(null);
        setProductSearch("");
        setShowProductDropdown(false);
        await Promise.all([fetchTransactions(), fetchWarehouseCapacities()]);

        // Show success message with warehouse info if available
        let successMessage = editingId
          ? "Transaksi berhasil diperbarui"
          : "Transaksi berhasil ditambahkan";

        if (result.warehouse_name) {
          successMessage += `\nGudang: ${result.warehouse_name}`;
        }

        Swal.fire({
          title: "Berhasil!",
          text: successMessage,
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        setFormError(result.message || "Gagal menyimpan transaksi");

        // Show detailed error for validation issues
        let errorMessage = result.message || "Gagal menyimpan transaksi";
        if (
          errorMessage.includes("WarehouseID") &&
          errorMessage.includes("required")
        ) {
          errorMessage =
            "⚠️ Backend belum direstart!\n\nSilakan restart backend server (go run main.go) agar perubahan struct diterapkan.\n\nError: " +
            errorMessage;
        } else if (
          errorMessage.includes("CreateTransactionRequest.ProductID") ||
          errorMessage.includes("CreateTransactionRequest.PenanggungJawab") ||
          errorMessage.includes("CreateTransactionRequest.Type") ||
          errorMessage.includes("CreateTransactionRequest.Jumlah")
        ) {
          errorMessage =
            "⚠️ Request transaksi tidak lengkap.\n\nSilakan refresh frontend (Ctrl+F5), login ulang, lalu pilih ulang Product/Type/Jumlah sebelum submit.\n\nError: " +
            errorMessage;
        }

        Swal.fire({
          title: "Gagal!",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      setFormError("Gagal menyimpan transaksi: " + err.message);
      Swal.fire({
        title: "Error!",
        text: "Gagal menyimpan transaksi: " + err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
    setSubmitting(false);
  };

  const deleteTransaction = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Transaksi?",
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
        `http://localhost:8080/api/v1/transactions/${id}`,
        {
          method: "DELETE",
        },
      );
      const resultData = await response.json();
      if (resultData.success) {
        setTransactions(transactions.filter((t) => t.id !== id));
        await fetchWarehouseCapacities();
        Swal.fire({
          title: "Berhasil!",
          text: "Transaksi berhasil dihapus",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Gagal!",
          text: resultData.message || "Gagal menghapus transaksi",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error!",
        text: "Gagal menghapus transaksi: " + err.message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/transactions/${id}`,
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

      await fetchTransactions();
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

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.nama_barang : `Product ${productId}`;
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse ? warehouse.nama_gudang : `Warehouse ${warehouseId}`;
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.nama_lengkap || user.email : `User ${userId}`;
  };

  // Transform data for filtering display
  const transactionsWithNames = transactions.map((t) => ({
    ...t,
    product_name: getProductName(t.product_id),
    warehouse_name: getWarehouseName(t.warehouse_id),
    user_name: getUserName(t.penanggung_jawab),
  }));

  // Calculate active filter count
  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== "",
  ).length;

  // Apply filters with searchAndFilter utility
  const filteredData = searchAndFilter(
    transactionsWithNames,
    search,
    ["product_name", "warehouse_name", "user_name", "id"],
    {
      type: filters.type,
      warehouse_id: filters.warehouse_id,
      penanggung_jawab: filters.penanggung_jawab,
      product_id: filters.product_id,
    },
    {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      dateField: "timestamp",
    },
  );
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Calculate pending count
  const pendingCount = transactions.filter(
    (t) => t.status === "pending",
  ).length;

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
            placeholder="Cari transaksi, produk, atau gudang..."
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
        <button
          onClick={recalculateInventory}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          title="Recalculate Inventory"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Hitung Ulang
        </button>
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
              {pendingCount} Tertunda
            </span>
          </div>
        )}
        {hasPermission(user?.role, PERMISSIONS.TRANSACTION_CREATE_IN) && (
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
            Tambah Transaksi
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
          <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan lacak transaksi inventaris dengan pembaruan waktu nyata.
          </p>
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
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    No
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Gudang
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Penanggung Jawab
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Kuantitas
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
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
                      colSpan={isStaff(user?.role) ? "8" : "9"}
                      className="px-5 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isStaff(user?.role) ? "8" : "9"}
                      className="px-5 py-4 text-center text-gray-500"
                    >
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {getProductName(transaction.product_id)}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {transaction.product_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {getWarehouseName(transaction.warehouse_id)}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {transaction.warehouse_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {getUserName(transaction.penanggung_jawab)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            transaction.type === "masuk"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {transaction.type === "masuk"
                            ? "📥 Masuk"
                            : "📤 Keluar"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {transaction.jumlah} units
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {new Date(transaction.timestamp).toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              transaction.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {transaction.status === "approved" ? (
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
                            {transaction.status === "approved"
                              ? "Approved"
                              : "Pending"}
                          </span>
                          {transaction.status === "pending" &&
                            !isStaff(user?.role) && (
                              <button
                                onClick={() =>
                                  changeStatus(transaction.id, "approved")
                                }
                                className="px-2 py-1 rounded text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                Approve
                              </button>
                            )}
                        </div>
                      </td>
                      {!isStaff(user?.role) && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(transaction)}
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
                              onClick={() => deleteTransaction(transaction.id)}
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
              hingga {" "}
              <span className="font-semibold text-gray-900">
                {Math.min(startIndex + itemsPerPage, filteredData.length)}
              </span>{" "}
              dari {" "}
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
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        data={transactionsWithNames}
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        columnFilters={[
          { key: "type", label: "Tipe Transaksi" },
          { key: "warehouse_id", label: "Gudang" },
          { key: "penanggung_jawab", label: "Penanggung Jawab" },
          { key: "product_id", label: "Produk" },
        ]}
        showDateRange={false}
        dateField="created_at"
      />

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId
                    ? "Edit Transaction"
                    : formData.type === "masuk"
                      ? "Transaksi Masuk"
                      : formData.type === "keluar"
                        ? "Transaksi Keluar"
                        : "Add New Transaction"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === "masuk"
                    ? "Tambahkan barang ke gudang"
                    : formData.type === "keluar"
                      ? "Gudang akan dipilih otomatis berdasarkan kapasitas tertinggi"
                      : "Pilih tipe transaksi di kanan atas"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle Masuk/Keluar */}
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "masuk" })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      formData.type === "masuk"
                        ? "bg-green-500 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    📥 Masuk
                  </button>
                  {!isStaff(user?.role) && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "keluar" })
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        formData.type === "keluar"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      📤 Keluar
                    </button>
                  )}
                </div>
                {isStaff(user?.role) && (
                  <span className="px-2 py-1 rounded-md text-xs text-gray-500 italic bg-gray-100 border border-gray-200">
                    Staff: Hanya Transaksi Masuk
                  </span>
                )}
                <button
                  onClick={() => setShowModal(false)}
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
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Product ID Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Produk
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari atau pilih produk..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                  {showProductDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                      {products
                        .filter((item) =>
                          item.nama_barang
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                product_id: item.id.toString(),
                              });
                              setProductSearch(item.nama_barang);
                              setShowProductDropdown(false);
                              // Update product weight
                              setSelectedProductWeight({
                                product_id: item.id,
                                nama_barang: item.nama_barang,
                                ukuran_kg: item.ukuran_kg || 0,
                              });
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-900"
                          >
                            {item.nama_barang || "Unnamed"}
                          </div>
                        ))}
                      {products.filter((item) =>
                        item.nama_barang
                          .toLowerCase()
                          .includes(productSearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          {products.length === 0
                            ? "Tidak ada produk..."
                            : "Tidak ada produk yang cocok"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Warehouse ID Dropdown - Only for "masuk" transactions */}
              {formData.type === "masuk" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gudang
                  </label>
                  <select
                    name="gudang_id"
                    value={formData.gudang_id}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    <option value="">
                      {warehouses.length === 0
                        ? "Tidak ada gudang..."
                        : "Pilih Gudang"}
                    </option>
                    {warehouses &&
                      Array.isArray(warehouses) &&
                      warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.nama_gudang || "Unnamed"}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Info for auto-select warehouse on "keluar" */}
              {formData.type === "keluar" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Pemilihan Gudang Otomatis
                      </p>
                      <p className="text-xs text-blue-700">
                        Sistem akan otomatis memilih gudang dengan kapasitas
                        terpakai tertinggi yang memiliki stok barang ini.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Display Warehouse Capacity Info (Weight-Based) - Only for "masuk" */}
              {formData.type === "masuk" && selectedWarehouseCapacity && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Total Kapasitas</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedWarehouseCapacity.total_kapasitas_kg} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Berat Saat Ini</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedWarehouseCapacity.total_berat_kg.toFixed(2)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Kapasitas Tersedia</p>
                      <p
                        className={`text-lg font-bold ${
                          selectedWarehouseCapacity.available_capacity_kg <= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {selectedWarehouseCapacity.available_capacity_kg.toFixed(
                          2,
                        )}{" "}
                        kg
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Unit</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedWarehouseCapacity.total_unit_count} unit
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600 mb-1">Penggunaan Kapasitas</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            selectedWarehouseCapacity.usage_percent > 80
                              ? "bg-red-500"
                              : selectedWarehouseCapacity.usage_percent > 50
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(selectedWarehouseCapacity.usage_percent, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedWarehouseCapacity.usage_percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Display Product Weight Info */}
              {selectedProductWeight && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm">
                    <p className="text-gray-600">Produk Terpilih</p>
                    <p className="text-lg font-bold text-green-600 mb-2">
                      {selectedProductWeight.nama_barang}
                    </p>
                    <p className="text-gray-600">
                      Berat Per Unit:{" "}
                      <span className="font-bold text-gray-900">
                        {selectedProductWeight.ukuran_kg} kg
                      </span>
                    </p>
                    {formData.jumlah && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-gray-600">
                          Estimasi Berat Transaksi
                        </p>
                        <p className="text-lg font-bold text-yellow-600">
                          {(
                            parseInt(formData.jumlah) *
                            selectedProductWeight.ukuran_kg
                          ).toFixed(2)}{" "}
                          kg
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Penanggung Jawab Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Penanggung Jawab{" "}
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
                    formData.penanggung_jawab
                      ? users.find(
                          (u) => u.id === Number(formData.penanggung_jawab),
                        )?.nama_lengkap ||
                        users.find(
                          (u) => u.id === Number(formData.penanggung_jawab),
                        )?.email ||
                        ""
                      : ""
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed opacity-75"
                />
              </div>

              {/* Warning if type not selected */}
              {!formData.type && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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
                  Pilih tipe transaksi (Masuk/Keluar) di pojok kanan atas
                </div>
              )}

              {/* Jumlah */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah (Unit) *
                </label>
                <input
                  type="text"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleFormChange}
                  placeholder="e.g., 50"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
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
                    ? "Update Transaction"
                    : "Create Transaction"}
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

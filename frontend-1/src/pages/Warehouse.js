import React, { useState, useEffect } from "react";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    fetchWarehouseCapacity();
  }, []);

  const fetchWarehouseCapacity = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/warehouses/capacity/status",
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Gagal mengambil data gudang");
        return;
      }

      setWarehouses(result.data || []);
    } catch (err) {
      setError("Koneksi error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseInventory = async (warehouseId, warehouseName) => {
    setInventoryLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/warehouses/${warehouseId}/inventory-status`,
      );
      const result = await response.json();

      if (!response.ok) {
        alert("Gagal mengambil data inventory");
        return;
      }

      setSelectedWarehouse({ id: warehouseId, nama: warehouseName });
      // The backend returns data as an object with inventory_details array
      let inventoryList = [];
      if (result.data) {
        if (Array.isArray(result.data)) {
          // If data is already an array
          inventoryList = result.data;
        } else if (
          result.data.inventory_details &&
          Array.isArray(result.data.inventory_details)
        ) {
          // If data is an object with inventory_details array
          inventoryList = result.data.inventory_details;
        } else if (typeof result.data === "object") {
          // Try to extract array from object
          const values = Object.values(result.data).find((v) =>
            Array.isArray(v),
          );
          if (values) {
            inventoryList = values;
          }
        }
      }
      setInventoryData(inventoryList);
      setModalOpen(true);
    } catch (err) {
      alert("Koneksi error: " + err.message);
    } finally {
      setInventoryLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedWarehouse(null);
    setInventoryData([]);
  };

  const formatNumber = (num) => {
    return Math.round(num * 100) / 100;
  };

  const getCapacityColor = (percentage) => {
    if (percentage < 50) return "#10b981"; // green
    if (percentage < 80) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getCapacityStatusText = (percentage) => {
    if (percentage < 50) return "Optimal";
    if (percentage < 80) return "Perhatian";
    return "Penuh";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manajemen Gudang
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Pantau kapasitas dan status barang di setiap lokasi gudang
              </p>
            </div>
            <button
              onClick={fetchWarehouseCapacity}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
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
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <svg
                className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-gray-600">Memuat data gudang...</p>
            </div>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">
              Belum ada data gudang
            </h3>
            <p className="text-gray-600 mt-2">
              Tambahkan gudang terlebih dahulu untuk melihat kapasitas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Jumlah Gudang
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {warehouses.length}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Kapasitas
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(
                        warehouses.reduce(
                          (sum, w) => sum + w.total_kapasitas_kg,
                          0,
                        ),
                      )}{" "}
                      kg
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Terpakai
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(
                        warehouses.reduce(
                          (sum, w) => sum + w.total_berat_kg,
                          0,
                        ),
                      )}{" "}
                      kg
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse Cards */}
            <div className="space-y-4">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.warehouse_id}
                  className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {warehouse.nama_gudang}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {warehouse.total_unit_count} unit •{" "}
                        {formatNumber(warehouse.total_berat_kg)} dari{" "}
                        {warehouse.total_kapasitas_kg} kg
                      </p>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{
                        backgroundColor: getCapacityColor(
                          warehouse.usage_percent,
                        ),
                      }}
                    >
                      {getCapacityStatusText(warehouse.usage_percent)}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Penggunaan Kapasitas
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(warehouse.usage_percent)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(warehouse.usage_percent, 100)}%`,
                          backgroundColor: getCapacityColor(
                            warehouse.usage_percent,
                          ),
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-medium">
                        Kapasitas Total
                      </p>
                      <p className="text-lg font-bold text-blue-900 mt-1">
                        {warehouse.total_kapasitas_kg} kg
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs text-orange-700 font-medium">
                        Terpakai
                      </p>
                      <p className="text-lg font-bold text-orange-900 mt-1">
                        {formatNumber(warehouse.total_berat_kg)} kg
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-700 font-medium">
                        Tersedia
                      </p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        {formatNumber(warehouse.available_capacity_kg)} kg
                      </p>
                    </div>
                  </div>

                  {/* View Detail Button */}
                  <button
                    onClick={() =>
                      fetchWarehouseInventory(
                        warehouse.warehouse_id,
                        warehouse.nama_gudang,
                      )
                    }
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Lihat Detail Barang
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Detail Barang Gudang
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedWarehouse?.nama}
                </p>
              </div>
              <button
                onClick={closeModal}
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
            <div className="px-6 py-4">
              {inventoryLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <svg
                      className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <p className="text-gray-600 text-sm">Memuat data...</p>
                  </div>
                </div>
              ) : inventoryData.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-600 font-medium">Gudang ini kosong</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Belum ada barang yang disimpan di gudang ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(inventoryData) &&
                    inventoryData
                      .filter((item) => (item.stok_units || item.stok || 0) > 0)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.nama_barang || "Nama Produk Tidak Tersedia"}
                            </h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              {item.ukuran_kg && (
                                <span className="flex items-center gap-1">
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
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Berat/pcs: {formatNumber(item.ukuran_kg)} kg
                                </span>
                              )}
                              <span className="flex items-center gap-1">
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Total Berat: {formatNumber(item.berat_kg)} kg
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {item.stok_units || item.stok || 0}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">pcs</p>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

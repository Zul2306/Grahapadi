import React, { useState, useEffect } from "react";

export default function ProductInventoryStatus() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inventoryData, setInventoryData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/products");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/warehouses");
      const result = await response.json();
      if (result.success) {
        setWarehouses(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const fetchProductInventory = async (productId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/products/${productId}/warehouse-inventory`,
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Gagal mengambil data inventory");
        setInventoryData({});
        setLoading(false);
        return;
      }

      // Process the result to create warehouse-based inventory data
      let inventoryMap = {};

      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((item) => {
          inventoryMap[item.warehouse_id] = {
            warehouse_name: item.warehouse_name,
            stok: item.stok || 0,
            berat_kg: item.berat_kg || 0,
          };
        });
      }

      setInventoryData(inventoryMap);
    } catch (err) {
      setError("Koneksi error: " + err.message);
      setInventoryData({});
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    fetchProductInventory(product.id);
  };

  const filteredProducts = products.filter((product) =>
    product.nama_barang.toLowerCase().includes(search.toLowerCase()),
  );

  const getTotalStock = () => {
    return Object.values(inventoryData).reduce(
      (sum, item) => sum + (item.stok || 0),
      0,
    );
  };

  const getTotalWeight = () => {
    return Object.values(inventoryData).reduce(
      (sum, item) => sum + (item.berat_kg || 0),
      0,
    );
  };

  const formatNumber = (num) => {
    return Math.round(num * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Status Inventory Produk
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Cari produk dan lihat stok di setiap gudang
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-24">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Cari Produk
              </label>
              <input
                type="text"
                placeholder="Ketik nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-gray-300 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-gray-500">
                      Produk tidak ditemukan
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
                        selectedProduct?.id === product.id
                          ? "bg-blue-50 border-blue-300 shadow-sm"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 text-sm">
                        {product.nama_barang}
                      </h4>
                      {product.kode_barang && (
                        <p className="text-xs text-gray-500 mt-1">
                          Kode: {product.kode_barang}
                        </p>
                      )}
                      {product.ukuran_kg && (
                        <p className="text-xs text-gray-500">
                          {formatNumber(product.ukuran_kg)} kg/pcs
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProduct ? (
              <>
                {/* Product Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Nama Produk
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedProduct.nama_barang}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      Total Stok
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {getTotalStock()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">pcs</p>
                  </div>

                  <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <p className="text-xs font-medium text-green-700 mb-1">
                      Total Berat
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatNumber(getTotalWeight())}
                    </p>
                    <p className="text-xs text-green-600 mt-1">kg</p>
                  </div>
                </div>

                {/* Additional Product Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Informasi Produk
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.kode_barang && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Kode Barang
                        </p>
                        <p className="font-medium text-gray-900">
                          {selectedProduct.kode_barang}
                        </p>
                      </div>
                    )}
                    {selectedProduct.jenis_barang && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Jenis Barang
                        </p>
                        <p className="font-medium text-gray-900">
                          {selectedProduct.jenis_barang}
                        </p>
                      </div>
                    )}
                    {selectedProduct.ukuran_kg && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Berat/Pcs</p>
                        <p className="font-medium text-gray-900">
                          {formatNumber(selectedProduct.ukuran_kg)} kg
                        </p>
                      </div>
                    )}
                    {selectedProduct.stok_minimal && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Stok Minimal
                        </p>
                        <p className="font-medium text-gray-900">
                          {selectedProduct.stok_minimal} pcs
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warehouse Inventory */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Distribusi di Gudang
                  </h3>

                  {loading ? (
                    <div className="flex justify-center py-8">
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
                        <p className="text-sm text-gray-600">
                          Memuat data inventory...
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  ) : Object.keys(inventoryData).length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        className="w-12 h-12 text-gray-300 mx-auto mb-2"
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
                      <p className="text-gray-600 font-medium">
                        Produk ini belum ada di gudang manapun
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {warehouses.map((warehouse) => {
                        const inventory = inventoryData[warehouse.id];
                        const qty = inventory?.stok || 0;
                        const weight = inventory?.berat_kg || 0;
                        const hasStock = qty > 0;

                        return (
                          <div
                            key={warehouse.id}
                            className={`rounded-lg border p-4 transition-colors ${
                              hasStock
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">
                                {warehouse.nama_gudang}
                              </h4>
                              {hasStock && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
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
                                  Ada Stok
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 font-medium mb-1">
                                  Jumlah
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {qty}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  pcs
                                </p>
                              </div>

                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 font-medium mb-1">
                                  Berat Total
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                  {formatNumber(weight)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">kg</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pilih Produk untuk Melihat Inventory
                </h3>
                <p className="text-gray-600">
                  Gunakan kotak pencarian di sebelah kiri untuk memilih produk
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
);

const API_BASE = "http://localhost:8080/api/v1";

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8", font: { size: 11 } },
    },
    y: { beginAtZero: true, ticks: { color: "#94a3b8", font: { size: 11 } } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 12, color: "#64748b" } },
  },
  cutout: "70%",
};

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRangeStartDate = (period) => {
  const now = new Date();
  const start = new Date(now);

  if (period === "7h") start.setDate(now.getDate() - 6);
  if (period === "30h") start.setDate(now.getDate() - 29);
  if (period === "90h") start.setDate(now.getDate() - 89);

  start.setHours(0, 0, 0, 0);
  return start;
};

const buildDayLabels = (period) => {
  const size = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const labels = [];
  const now = new Date();

  for (let i = size - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    labels.push(day.toISOString().slice(0, 10));
  }

  return labels;
};

const getTypeMeta = (type) => {
  if (type === "masuk") {
    return {
      label: "MASUK",
      qtyColor: "text-emerald-600",
      badgeColor: "bg-emerald-100 text-emerald-700",
      prefix: "+",
    };
  }

  return {
    label: "KELUAR",
    qtyColor: "text-red-500",
    badgeColor: "bg-red-100 text-red-600",
    prefix: "-",
  };
};

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [warehouseCapacities, setWarehouseCapacities] = useState([]);
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          productsRes,
          transactionsRes,
          capacitiesRes,
          inventoryRes,
          usersRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/transactions`),
          fetch(`${API_BASE}/warehouses/capacity/status`),
          fetch(`${API_BASE}/warehouse-inventory`),
          fetch(`${API_BASE}/users`),
        ]);

        const [
          productsJson,
          transactionsJson,
          capacitiesJson,
          inventoryJson,
          usersJson,
        ] = await Promise.all([
          productsRes.json(),
          transactionsRes.json(),
          capacitiesRes.json(),
          inventoryRes.json(),
          usersRes.json(),
        ]);

        setProducts(Array.isArray(productsJson?.data) ? productsJson.data : []);
        setTransactions(
          Array.isArray(transactionsJson?.data) ? transactionsJson.data : [],
        );
        setWarehouseCapacities(
          Array.isArray(capacitiesJson?.data) ? capacitiesJson.data : [],
        );
        setWarehouseInventory(
          Array.isArray(inventoryJson?.data) ? inventoryJson.data : [],
        );
        setUsers(Array.isArray(usersJson?.data) ? usersJson.data : []);
      } catch (err) {
        setError(`Gagal memuat dashboard: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  const warehouseMap = useMemo(() => {
    const map = new Map();
    warehouseCapacities.forEach((warehouse) =>
      map.set(warehouse.warehouse_id, warehouse.nama_gudang),
    );
    return map;
  }, [warehouseCapacities]);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((user) =>
      map.set(user.id, user.nama_lengkap || user.email || `User #${user.id}`),
    );
    return map;
  }, [users]);

  const filteredTransactions = useMemo(() => {
    const startDate = getRangeStartDate(period);
    return transactions.filter((tx) => {
      const time = new Date(tx.timestamp);
      return !Number.isNaN(time.getTime()) && time >= startDate;
    });
  }, [transactions, period]);

  const stokPerProduct = useMemo(() => {
    const map = new Map();
    warehouseInventory.forEach((item) => {
      const prev = map.get(item.product_id) || 0;
      map.set(item.product_id, prev + (Number(item.stok) || 0));
    });
    return map;
  }, [warehouseInventory]);

  const lowStockList = useMemo(() => {
    return products
      .map((product) => ({
        id: product.id,
        nama_barang: product.nama_barang,
        stok_saat_ini: stokPerProduct.get(product.id) || 0,
        stok_minimal: Number(product.stok_minimal) || 0,
      }))
      .filter((item) => item.stok_saat_ini <= item.stok_minimal)
      .sort(
        (a, b) =>
          a.stok_saat_ini - b.stok_saat_ini || a.stok_minimal - b.stok_minimal,
      );
  }, [products, stokPerProduct]);

  const kpiData = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const totalMasuk = filteredTransactions
      .filter((tx) => tx.type === "masuk")
      .reduce((sum, tx) => sum + (Number(tx.jumlah) || 0), 0);
    const totalKeluar = filteredTransactions
      .filter((tx) => tx.type === "keluar")
      .reduce((sum, tx) => sum + (Number(tx.jumlah) || 0), 0);
    const netMovement = totalMasuk - totalKeluar;

    return [
      {
        label: "TOTAL TRANSAKSI",
        value: formatNumber(totalTransactions),
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-100",
      },
      {
        label: "TOTAL MASUK (UNIT)",
        value: formatNumber(totalMasuk),
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
      },
      {
        label: "TOTAL KELUAR (UNIT)",
        value: formatNumber(totalKeluar),
        color: "text-red-500",
        bg: "bg-red-50 border-red-100",
      },
      {
        label: "GERAKAN BERSIH",
        value: formatNumber(netMovement),
        color: netMovement >= 0 ? "text-emerald-600" : "text-red-500",
        bg:
          netMovement >= 0
            ? "bg-emerald-50 border-emerald-100"
            : "bg-red-50 border-red-100",
      },
      {
        label: "PRODUK STOK RENDAH",
        value: formatNumber(lowStockList.length),
        color: lowStockList.length > 0 ? "text-amber-600" : "text-gray-700",
        bg:
          lowStockList.length > 0
            ? "bg-amber-50 border-amber-100"
            : "bg-gray-50 border-gray-100",
      },
    ];
  }, [filteredTransactions, lowStockList]);

  const topWarehouses = useMemo(() => {
    const activityMap = new Map();

    filteredTransactions.forEach((tx) => {
      const prev = activityMap.get(tx.warehouse_id) || 0;
      activityMap.set(tx.warehouse_id, prev + (Number(tx.jumlah) || 0));
    });

    return warehouseCapacities
      .map((warehouse) => ({
        warehouse_id: warehouse.warehouse_id,
        nama_gudang: warehouse.nama_gudang,
        usage_percent: Number(warehouse.usage_percent) || 0,
        total_activity: activityMap.get(warehouse.warehouse_id) || 0,
      }))
      .sort((a, b) => b.total_activity - a.total_activity)
      .slice(0, 3);
  }, [filteredTransactions, warehouseCapacities]);

  const topProducts = useMemo(() => {
    const movementMap = new Map();

    filteredTransactions.forEach((tx) => {
      const prev = movementMap.get(tx.product_id) || 0;
      movementMap.set(tx.product_id, prev + Math.abs(Number(tx.jumlah) || 0));
    });

    return Array.from(movementMap.entries())
      .map(([productId, movement]) => ({
        product_id: productId,
        nama_barang:
          productMap.get(productId)?.nama_barang || `Product #${productId}`,
        movement,
      }))
      .sort((a, b) => b.movement - a.movement)
      .slice(0, 5);
  }, [filteredTransactions, productMap]);

  const dailyLineData = useMemo(() => {
    const labels = buildDayLabels(period);
    const dailyMasuk = {};
    const dailyKeluar = {};

    filteredTransactions.forEach((tx) => {
      const dayKey = new Date(tx.timestamp).toISOString().slice(0, 10);
      const qty = Number(tx.jumlah) || 0;
      if (tx.type === "masuk") {
        dailyMasuk[dayKey] = (dailyMasuk[dayKey] || 0) + qty;
      }
      if (tx.type === "keluar") {
        dailyKeluar[dayKey] = (dailyKeluar[dayKey] || 0) + qty;
      }
    });

    return {
      labels: labels.map((d) =>
        new Date(d).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
      ),
      datasets: [
        {
          label: "Masuk",
          data: labels.map((d) => dailyMasuk[d] || 0),
          borderColor: "#10b981",
          backgroundColor: "rgba(16,185,129,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2.5,
        },
        {
          label: "Keluar",
          data: labels.map((d) => dailyKeluar[d] || 0),
          borderColor: "#ef4444",
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 4],
        },
      ],
    };
  }, [filteredTransactions, period]);

  const movementComposition = useMemo(() => {
    const masuk = filteredTransactions
      .filter((tx) => tx.type === "masuk")
      .reduce((sum, tx) => sum + (Number(tx.jumlah) || 0), 0);
    const keluar = filteredTransactions
      .filter((tx) => tx.type === "keluar")
      .reduce((sum, tx) => sum + (Number(tx.jumlah) || 0), 0);

    return {
      masuk,
      keluar,
      chart: {
        labels: ["Masuk", "Keluar"],
        datasets: [
          {
            data: [masuk, keluar],
            backgroundColor: ["#10b981", "#ef4444"],
            borderColor: ["#10b981", "#ef4444"],
            borderWidth: 1,
          },
        ],
      },
    };
  }, [filteredTransactions]);

  const latestTransactions = useMemo(() => {
    const sorted = filteredTransactions
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const mapped = sorted.map((tx) => {
      const typeMeta = getTypeMeta(tx.type);
      const product = productMap.get(tx.product_id);
      const jumlah = Number(tx.jumlah) || 0;
      const ukuran = Number(product?.ukuran_kg) || 0;

      return {
        id: tx.id,
        time: tx.timestamp,
        productName: product?.nama_barang || `Product #${tx.product_id}`,
        warehouseName:
          warehouseMap.get(tx.warehouse_id) || `Gudang #${tx.warehouse_id}`,
        picName:
          userMap.get(tx.penanggung_jawab) || `User #${tx.penanggung_jawab}`,
        typeLabel: typeMeta.label,
        typeBadge: typeMeta.badgeColor,
        qty: `${typeMeta.prefix}${formatNumber(jumlah)}`,
        qtyColor: typeMeta.qtyColor,
        totalWeight: `${(jumlah * ukuran).toFixed(2)} kg`,
      };
    });

    if (!query) return mapped.slice(0, 10);

    const q = query.toLowerCase();
    return mapped
      .filter(
        (item) =>
          item.productName.toLowerCase().includes(q) ||
          item.warehouseName.toLowerCase().includes(q) ||
          item.picName.toLowerCase().includes(q) ||
          item.typeLabel.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [filteredTransactions, productMap, warehouseMap, userMap, query]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between pl-10 lg:pl-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">
                Ikhtisar Dasbor
              </h1>
              <p className="text-xs text-gray-500">
                Analitik inventaris waktu nyata
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                Hidup
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
            <span className="font-medium">
              {new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Periode Analisis
              </h3>
              <div className="flex gap-2">
                {["7d", "30d", "90d"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setPeriod(value)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all duration-200 ${
                      period === value
                        ? "border-blue-500 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:scale-105"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Total Transaksi Periode
              </p>
              <p className="text-2xl font-black text-gray-900">
                {loading ? "-" : formatNumber(filteredTransactions.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {kpiData.map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-2xl border-2 p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${kpi.bg}`}
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {kpi.label}
              </p>
              <p className={`text-3xl font-black ${kpi.color} tracking-tight`}>
                {loading ? "..." : kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-black text-gray-900">
                Grafik Harian Transaksi
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Unit masuk dan keluar per hari pada periode aktif
              </p>
            </div>
            <div className="h-72 mt-4">
              <Line data={dailyLineData} options={lineOptions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-black text-gray-900">Komposisi</h2>
              <p className="text-xs text-gray-500 mt-1">Masuk vs Keluar</p>
            </div>
            <div className="h-56 mt-4">
              <Doughnut
                data={movementComposition.chart}
                options={doughnutOptions}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-3 shadow-md">
                <p className="text-xs text-emerald-700 font-semibold mb-1">
                  Masuk
                </p>
                <p className="text-xl font-black text-emerald-600">
                  {loading ? "..." : formatNumber(movementComposition.masuk)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-3 shadow-md">
                <p className="text-xs text-red-700 font-semibold mb-1">
                  Keluar
                </p>
                <p className="text-xl font-black text-red-600">
                  {loading ? "..." : formatNumber(movementComposition.keluar)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-black text-gray-900">Top 3 Gudang</h2>
              <p className="text-xs text-gray-500 mt-1">
                Paling aktif periode ini
              </p>
            </div>
            <div className="space-y-3">
              {topWarehouses.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Belum ada aktivitas gudang.
                </p>
              )}
              {topWarehouses.map((item, index) => (
                <div
                  key={item.warehouse_id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
                      <span className="text-lg font-black text-blue-700">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">
                        {item.nama_gudang}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Kapasitas: {item.usage_percent.toFixed(1)}% terpakai
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-600">
                        {formatNumber(item.total_activity)}
                      </p>
                      <p className="text-xs text-gray-500">unit</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-black text-gray-900">Top 5 Produk</h2>
              <p className="text-xs text-gray-500 mt-1">
                Paling bergerak periode ini
              </p>
            </div>
            <div className="space-y-3">
              {topProducts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Belum ada pergerakan produk.
                </p>
              )}
              {topProducts.map((item, index) => (
                <div
                  key={item.product_id}
                  className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-lg transition-all duration-300 hover:scale-102 bg-gradient-to-r from-white to-indigo-50/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border-2 border-indigo-300 shadow-md">
                      <span className="text-lg font-black text-indigo-700">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.nama_barang}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {item.product_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600">
                      {formatNumber(item.movement)}
                    </p>
                    <p className="text-xs text-gray-500">unit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    Transaksi Terbaru
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    10 Transaksi terakhir
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white border-2 border-gray-300 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                    className="text-sm text-gray-700 bg-transparent outline-none w-56 placeholder-gray-400 font-medium"
                    placeholder="Cari produk, gudang, PIC..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      Gudang
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      Berat
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-black text-gray-600 uppercase tracking-wider">
                      PIC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-gray-500">
                          {loading
                            ? "Memuat transaksi..."
                            : "Tidak ada transaksi pada periode ini"}
                        </p>
                      </td>
                    </tr>
                  )}
                  {latestTransactions.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {formatDateTime(item.time)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {item.warehouseName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block text-xs font-black px-3 py-1.5 rounded-full ${item.typeBadge} shadow-md`}
                        >
                          {item.typeLabel}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right text-sm font-black ${item.qtyColor}`}
                      >
                        {item.qty}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 font-bold">
                        {item.totalWeight}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {item.picName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-black text-gray-900">
                Peringatan Stok Rendah
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Perlu perhatian segera
              </p>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {lowStockList.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm font-semibold text-emerald-600">
                    Semua produk stok aman!
                  </p>
                </div>
              )}
              {lowStockList.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                >
                  <p className="text-sm font-bold text-amber-900 mb-2">
                    {item.nama_barang}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-sm">
                      <span className="text-amber-700 font-semibold">
                        Stok:{" "}
                      </span>
                      <span className="font-black text-red-600">
                        {formatNumber(item.stok_saat_ini)}
                      </span>
                    </div>
                    <div className="bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-sm">
                      <span className="text-amber-700 font-semibold">
                        Min:{" "}
                      </span>
                      <span className="font-black text-amber-900">
                        {formatNumber(item.stok_minimal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-gray-600 font-semibold">
            © 2024 Sistem Inventaris Terpadu
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#!"
              className="text-gray-500 hover:text-blue-600 font-semibold uppercase tracking-wider transition-colors"
            >
              Dokumentasi
            </a>
            <a
              href="#!"
              className="text-gray-500 hover:text-emerald-600 font-semibold uppercase tracking-wider transition-colors"
            >
              Status Sistem
            </a>
            <a
              href="#!"
              className="text-gray-500 hover:text-indigo-600 font-semibold uppercase tracking-wider transition-colors"
            >
              Pusat Dukungan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

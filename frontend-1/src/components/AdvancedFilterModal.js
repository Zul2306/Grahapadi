import React, { useState, useMemo } from "react";
import { getUniqueValues, getYearsFromData, MONTHS } from "../utils/filterHelpers";

/**
 * Advanced Filter Modal - Reusable untuk semua halaman
 * 
 * @param {boolean} isOpen - Kontrol modal open/close
 * @param {function} onClose - Callback saat close
 * @param {array} data - Data yang akan di-filter
 * @param {object} filters - Current filter state (includes column filters + date filters)
 * @param {function} onFilterChange - Callback saat filter berubah
 * @param {array} columnFilters - Array of { key, label, type } untuk column filters
 * @param {boolean} showDateRange - Tampilkan date range filter?
 * @param {string} dateField - Field name untuk date (default: 'created_at')
 */
export default function AdvancedFilterModal({
  isOpen,
  onClose,
  data,
  filters,
  onFilterChange,
  columnFilters = [],
  showDateRange = false,
  dateField = "created_at",
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Get unique values untuk setiap column
  const uniqueValues = useMemo(() => {
    const result = {};
    columnFilters.forEach(({ key, label }) => {
      result[key] = getUniqueValues(data, key).sort((a, b) => {
        // Sort string values
        if (typeof a === "string" && typeof b === "string") {
          return a.localeCompare(b);
        }
        return a - b;
      });
    });
    return result;
  }, [data, columnFilters]);

  // Get years dari data
  const years = useMemo(() => getYearsFromData(data, dateField), [data, dateField]);

  const handleFilterChange = (filterKey, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const emptyFilters = {};
    columnFilters.forEach(({ key }) => {
      emptyFilters[key] = "";
    });
    if (showDateRange) {
      emptyFilters.dateFrom = "";
      emptyFilters.dateTo = "";
      emptyFilters.month = "";
      emptyFilters.year = "";
    }
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  if (!isOpen) return null;

  const activeFiltersCount = Object.values(localFilters).filter(
    (v) => v && v !== ""
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Advanced Filter</h2>
            {activeFiltersCount > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {activeFiltersCount} filter aktif
              </p>
            )}
          </div>
          <button
            onClick={onClose}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Column Filters */}
          {columnFilters.map(({ key, label, type = "select" }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
              </label>

              {type === "select" && (
                <select
                  value={localFilters[key] || ""}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="">-- Semua --</option>
                  {uniqueValues[key]?.map((value) => (
                    <option key={value} value={value}>
                      {typeof value === "boolean"
                        ? value
                          ? "Ya"
                          : "Tidak"
                        : String(value)}
                    </option>
                  ))}
                </select>
              )}

              {type === "checkbox" && (
                <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                  {uniqueValues[key]?.map((value) => (
                    <label key={value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(localFilters[key])
                            ? localFilters[key].includes(value)
                            : false
                        }
                        onChange={(e) => {
                          const current = Array.isArray(localFilters[key])
                            ? localFilters[key]
                            : [];
                          if (e.target.checked) {
                            handleFilterChange(key, [...current, value]);
                          } else {
                            handleFilterChange(
                              key,
                              current.filter((v) => v !== value)
                            );
                          }
                        }}
                        className="rounded border border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {typeof value === "boolean"
                          ? value
                            ? "Ya"
                            : "Tidak"
                          : String(value)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Date Range Filter */}
          {showDateRange && (
            <>
              <div className="pt-3 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Filter Tanggal
                </h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ""}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={localFilters.dateTo || ""}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Month & Year Filter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bulan
                  </label>
                  <select
                    value={localFilters.month || ""}
                    onChange={(e) => handleFilterChange("month", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    <option value="">-- Semua --</option>
                    {MONTHS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tahun
                  </label>
                  <select
                    value={localFilters.year || ""}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    <option value="">-- Semua --</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}

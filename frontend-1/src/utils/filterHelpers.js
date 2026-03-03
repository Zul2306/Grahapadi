/**
 * Helper functions untuk filtering dan searching
 */

/**
 * Extract unique values dari array of objects berdasarkan key
 */
export const getUniqueValues = (data, key) => {
  if (!Array.isArray(data)) return [];
  const unique = [...new Set(data.map((item) => item[key]))];
  return unique.filter(
    (val) => val !== null && val !== undefined && val !== "",
  );
};

/**
 * Filter data berdasarkan multiple criteria
 */
export const applyFilters = (data, filters) => {
  if (!Array.isArray(data)) return [];

  return data.filter((item) => {
    // Check setiap filter
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue; // Skip empty filters

      // Date range filter
      if (key === "dateFrom" || key === "dateTo") {
        // Handle date separately
        continue;
      }

      // Single value filter
      if (typeof value === "string" || typeof value === "number") {
        if (item[key] !== value) return false;
      }

      // Array filter (multiple selections)
      if (Array.isArray(value) && value.length > 0) {
        if (!value.includes(item[key])) return false;
      }
    }

    return true;
  });
};

/**
 * Filter data by date range
 */
export const applyDateFilter = (
  data,
  dateFrom,
  dateTo,
  dateField = "created_at",
) => {
  if (!Array.isArray(data)) return [];

  // If no date filters provided, return all data
  if (!dateFrom && !dateTo) return data;

  const filtered = data.filter((item) => {
    // Skip items without the date field
    if (!item[dateField]) {
      return false;
    }

    // Parse the item's date - handle both ISO strings and Date objects
    let itemDate = item[dateField];
    if (typeof itemDate === "string") {
      itemDate = new Date(itemDate);
    } else if (!(itemDate instanceof Date)) {
      itemDate = new Date(itemDate);
    }

    // Handle invalid dates
    if (isNaN(itemDate.getTime())) {
      return false;
    }

    // Apply from date filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (itemDate < from) {
        return false;
      }
    }

    // Apply to date filter
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) {
        return false;
      }
    }

    return true;
  });

  return filtered;
};

/**
 * Filter data by month and year
 */
export const applyMonthYearFilter = (
  data,
  month,
  year,
  dateField = "created_at",
) => {
  if (!Array.isArray(data)) return [];

  return data.filter((item) => {
    const itemDate = new Date(item[dateField]);
    const itemMonth = itemDate.getMonth() + 1; // 1-12
    const itemYear = itemDate.getFullYear();

    if (month && itemMonth !== parseInt(month)) return false;
    if (year && itemYear !== parseInt(year)) return false;

    return true;
  });
};

/**
 * Combine global search + filters
 */
export const searchAndFilter = (
  data,
  searchTerm,
  searchFields,
  filters,
  dateFilters = {},
) => {
  let result = [...data];

  // Apply global search
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return value?.toString().toLowerCase().includes(term);
      }),
    );
  }

  // Apply column filters
  result = applyFilters(result, filters);

  // Apply date filters if provided
  if (dateFilters.dateFrom || dateFilters.dateTo) {
    result = applyDateFilter(
      result,
      dateFilters.dateFrom,
      dateFilters.dateTo,
      dateFilters.dateField,
    );
  }

  // Apply month/year filters if provided
  if (dateFilters.month || dateFilters.year) {
    result = applyMonthYearFilter(
      result,
      dateFilters.month,
      dateFilters.year,
      dateFilters.dateField,
    );
  }
  return result;
};

/**
 * Get all years from data
 */
export const getYearsFromData = (data, dateField = "created_at") => {
  if (!Array.isArray(data)) return [];

  const years = new Set();
  data.forEach((item) => {
    const date = new Date(item[dateField]);
    years.add(date.getFullYear());
  });

  return Array.from(years).sort((a, b) => b - a);
};

/**
 * Get month names
 */
export const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

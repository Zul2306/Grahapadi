// Role-based permission helper functions

export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
};

export const PERMISSIONS = {
  // Product Management
  PRODUCT_VIEW: "product:view",
  PRODUCT_CREATE: "product:create",
  PRODUCT_EDIT: "product:edit",
  PRODUCT_DELETE: "product:delete",

  // Transactions
  TRANSACTION_VIEW: "transaction:view",
  TRANSACTION_CREATE: "transaction:create",
  TRANSACTION_CREATE_IN: "transaction:create:in", // Khusus transaksi masuk
  TRANSACTION_EDIT: "transaction:edit",
  TRANSACTION_DELETE: "transaction:delete",

  // Stock Opname
  STOCK_OPNAME_VIEW: "stockopname:view",
  STOCK_OPNAME_CREATE: "stockopname:create",
  STOCK_OPNAME_EDIT: "stockopname:edit",
  STOCK_OPNAME_DELETE: "stockopname:delete",

  // User Management
  USER_MANAGEMENT_VIEW: "user:view",
  USER_MANAGEMENT_CREATE: "user:create",
  USER_MANAGEMENT_EDIT: "user:edit",
  USER_MANAGEMENT_DELETE: "user:delete",

  // Warehouse
  WAREHOUSE_VIEW: "warehouse:view",
  WAREHOUSE_CREATE: "warehouse:create",
  WAREHOUSE_EDIT: "warehouse:edit",
  WAREHOUSE_DELETE: "warehouse:delete",

  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
};

// Role permission mapping
const rolePermissions = {
  admin: [
    // Admin has all permissions
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.TRANSACTION_CREATE,
    PERMISSIONS.TRANSACTION_CREATE_IN,
    PERMISSIONS.TRANSACTION_EDIT,
    PERMISSIONS.TRANSACTION_DELETE,
    PERMISSIONS.STOCK_OPNAME_VIEW,
    PERMISSIONS.STOCK_OPNAME_CREATE,
    PERMISSIONS.STOCK_OPNAME_EDIT,
    PERMISSIONS.STOCK_OPNAME_DELETE,
    PERMISSIONS.USER_MANAGEMENT_VIEW,
    PERMISSIONS.USER_MANAGEMENT_CREATE,
    PERMISSIONS.USER_MANAGEMENT_EDIT,
    PERMISSIONS.USER_MANAGEMENT_DELETE,
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.WAREHOUSE_CREATE,
    PERMISSIONS.WAREHOUSE_EDIT,
    PERMISSIONS.WAREHOUSE_DELETE,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
  staff: [
    // Staff limited permissions
    PERMISSIONS.PRODUCT_VIEW, // View only
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.TRANSACTION_CREATE_IN, // Hanya create transaksi masuk
    PERMISSIONS.STOCK_OPNAME_VIEW,
    PERMISSIONS.STOCK_OPNAME_CREATE, // Staff bisa create stock opname
    PERMISSIONS.WAREHOUSE_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
};

/**
 * Check if user has specific permission
 * @param {string} userRole - User role (admin, staff)
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = rolePermissions[userRole.toLowerCase()] || [];
  return permissions.includes(permission);
};

/**
 * Check if user can access a menu
 * @param {string} userRole - User role
 * @param {string} menuPath - Menu path
 * @returns {boolean}
 */
export const canAccessMenu = (userRole, menuPath) => {
  if (!userRole) return false;

  const role = userRole.toLowerCase();

  // Admin can access all menus
  if (role === ROLES.ADMIN) return true;

  // Staff restrictions
  if (role === ROLES.STAFF) {
    // Staff cannot access User Management
    if (menuPath === "/users") return false;
    return true; // Can access other menus
  }

  return false;
};

/**
 * Check if user is admin
 * @param {string} userRole - User role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => {
  return userRole?.toLowerCase() === ROLES.ADMIN;
};

/**
 * Check if user is staff
 * @param {string} userRole - User role
 * @returns {boolean}
 */
export const isStaff = (userRole) => {
  return userRole?.toLowerCase() === ROLES.STAFF;
};

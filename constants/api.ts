export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    user: "/api/auth/user",
  },
  dashboard: "/api/dashboard",
  settings: {
    root: "/api/settings",
    bootstrap: "/api/settings/bootstrap",
    reset: "/api/settings/reset",
  },
  products: {
    root: "/api/products",
    detail: (id: string) => `/api/products/${encodeURIComponent(id)}`,
    brands: "/api/products/brands",
    options: "/api/products/options",
    summary: "/api/products/summary",
    matches: "/api/products/matches",
    import: "/api/products/import",
  },
  sales: {
    root: "/api/sales",
    detail: (id: string) => `/api/sales/${encodeURIComponent(id)}`,
    summary: "/api/sales/summary",
    import: "/api/sales/import",
  },
  fees: {
    root: "/api/fees",
    detail: (id: string) => `/api/fees/${encodeURIComponent(id)}`,
    active: "/api/fees/active",
    summary: "/api/fees/summary",
  },
  vials: {
    root: "/api/vials",
    detail: (id: string) => `/api/vials/${encodeURIComponent(id)}`,
    active: "/api/vials/active",
  },
  decants: {
    root: "/api/decants",
    detail: (id: string) => `/api/decants/${encodeURIComponent(id)}`,
  },
} as const;

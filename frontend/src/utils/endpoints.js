export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },
  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  CONTACTS: {
    SUBMIT: "/contacts",
    LIST: "/contacts",
    UPDATE_STATUS: (id) => `/contacts/${id}`,
    DELETE: (id) => `/contacts/${id}`,
  },
  ADMIN: {
    STATS: "/admin/stats",
  },
  UPLOAD: "/upload",
};

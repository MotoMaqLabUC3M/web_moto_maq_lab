import { getToken, clearToken } from "./auth";
import type {
  AuthResponse,
  BlogPost,
  DashboardStats,
  Department,
  TeamMember,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiClientError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;
  return data;
}

function ensureArray<T>(data: T[] | null | undefined): T[] {
  return data ?? [];
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
      false,
    ),

  me: () => request<User>("/api/v1/auth/me"),

  listDepartments: () =>
    request<Department[] | null>("/api/v1/departments").then(ensureArray),

  createDepartment: (data: {
    slug?: string;
    title_es: string;
    title_en?: string;
    sort_order?: number;
  }) =>
    request<Department>("/api/v1/departments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDepartment: (
    id: string,
    data: Partial<{
      slug: string;
      title_es: string;
      title_en: string;
      sort_order: number;
    }>,
  ) =>
    request<Department>(`/api/v1/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteDepartment: (id: string) =>
    request<void>(`/api/v1/departments/${id}`, { method: "DELETE" }),

  createMember: (
    departmentId: string,
    data: {
      name: string;
      role_es: string;
      role_en?: string;
      sort_order?: number;
    },
  ) =>
    request<TeamMember>(`/api/v1/departments/${departmentId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateMember: (
    id: string,
    data: Partial<{
      department_id: string;
      name: string;
      role_es: string;
      role_en: string;
      sort_order: number;
    }>,
  ) =>
    request<TeamMember>(`/api/v1/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteMember: (id: string) =>
    request<void>(`/api/v1/members/${id}`, { method: "DELETE" }),

  uploadMemberPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return request<TeamMember>(`/api/v1/members/${id}/photo`, {
      method: "POST",
      body: form,
    });
  },

  removeMemberPhoto: (id: string) =>
    request<TeamMember>(`/api/v1/members/${id}/photo`, { method: "DELETE" }),

  listPosts: (locale?: string) =>
    request<BlogPost[] | null>(
      `/api/v1/blog/posts${locale ? `?locale=${locale}` : ""}`,
    ).then(ensureArray),

  getPost: (id: string) => request<BlogPost>(`/api/v1/blog/posts/${id}`),

  createPost: (data: Partial<BlogPost>) =>
    request<BlogPost>("/api/v1/blog/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePost: (id: string, data: Partial<BlogPost>) =>
    request<BlogPost>(`/api/v1/blog/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    request<void>(`/api/v1/blog/posts/${id}`, { method: "DELETE" }),

  uploadMedia: (file: File, slug?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (slug) form.append("slug", slug);
    return request<{ path: string }>("/api/v1/media/upload", {
      method: "POST",
      body: form,
    });
  },

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("cover", file);
    return request<BlogPost>(`/api/v1/blog/posts/${id}/cover`, {
      method: "POST",
      body: form,
    });
  },

  stats: () => request<DashboardStats>("/api/v1/stats"),
};

export { ApiClientError };

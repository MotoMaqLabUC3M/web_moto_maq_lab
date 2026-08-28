export type User = {
  id: string;
  username: string;
  role: string;
  created_at: string;
};

export type AuthResponse = {
  token: string;
  expires_in: number;
  user: User;
};

export type TeamMember = {
  id: string;
  department_id: string;
  name: string;
  role_es: string;
  role_en: string;
  image_path?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: string;
  slug: string;
  title_es: string;
  title_en: string;
  sort_order: number;
  members?: TeamMember[];
  created_at: string;
  updated_at: string;
};

export type BlogBlock = {
  id: string;
  type: string;
  content: Record<string, unknown>;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  cover_image?: string;
  excerpt: string;
  blocks: BlogBlock[];
  locale: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  departments: number;
  members: number;
  posts: number;
  published: number;
};

export type ApiError = {
  error: string;
};

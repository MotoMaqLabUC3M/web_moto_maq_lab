package domain

import (
	"encoding/json"
	"time"
)

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Department struct {
	ID        string        `json:"id"`
	Slug      string        `json:"slug"`
	TitleES   string        `json:"title_es"`
	TitleEN   string        `json:"title_en"`
	SortOrder int           `json:"sort_order"`
	Members   []TeamMember  `json:"members,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type TeamMember struct {
	ID           string    `json:"id"`
	DepartmentID string    `json:"department_id"`
	Name         string    `json:"name"`
	RoleES       string    `json:"role_es"`
	RoleEN       string    `json:"role_en"`
	ImagePath    string    `json:"image_path,omitempty"`
	SortOrder    int       `json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type BlogBlock struct {
	ID      string          `json:"id"`
	Type    string          `json:"type"`
	Content json.RawMessage `json:"content"`
}

type BlogPost struct {
	ID         string      `json:"id"`
	Slug       string      `json:"slug"`
	Title      string      `json:"title"`
	Author     string      `json:"author"`
	Date       string      `json:"date"`
	Category   string      `json:"category"`
	CoverImage string      `json:"cover_image,omitempty"`
	Excerpt    string      `json:"excerpt"`
	Blocks     []BlogBlock `json:"blocks"`
	Locale     string      `json:"locale"`
	Published  bool        `json:"published"`
	SectionID  string      `json:"section_id,omitempty"`
	SortOrder  int         `json:"sort_order"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

type BlogSection struct {
	ID         string     `json:"id"`
	Slug       string     `json:"slug"`
	TitleES    string     `json:"title_es"`
	TitleEN    string     `json:"title_en"`
	SubtitleES string     `json:"subtitle_es"`
	SubtitleEN string     `json:"subtitle_en"`
	Layout     string     `json:"layout"`
	SortOrder  int        `json:"sort_order"`
	Posts      []BlogPost `json:"posts,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token     string `json:"token"`
	ExpiresIn int64  `json:"expires_in"`
	User      User   `json:"user"`
}

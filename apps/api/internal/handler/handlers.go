package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/service"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	resp, err := h.auth.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	user := userFromContext(r.Context())
	if user.ID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	u, err := h.auth.Me(r.Context(), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load user")
		return
	}
	writeJSON(w, http.StatusOK, u)
}

type TeamHandler struct {
	team *service.TeamService
}

func NewTeamHandler(team *service.TeamService) *TeamHandler {
	return &TeamHandler{team: team}
}

func (h *TeamHandler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	deps, err := h.team.ListDepartments(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list departments")
		return
	}
	writeJSON(w, http.StatusOK, deps)
}

func (h *TeamHandler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	var in service.DepartmentInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	d, err := h.team.CreateDepartment(r.Context(), in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, d)
}

func (h *TeamHandler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	var in service.DepartmentInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	d, err := h.team.UpdateDepartment(r.Context(), id, in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func (h *TeamHandler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	if err := h.team.DeleteDepartment(r.Context(), id); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TeamHandler) ReorderDepartments(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := h.team.ReorderDepartments(r.Context(), body.IDs); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TeamHandler) ReorderMembers(w http.ResponseWriter, r *http.Request) {
	departmentID := chiURLParam(r, "id")
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := h.team.ReorderMembers(r.Context(), departmentID, body.IDs); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TeamHandler) CreateMember(w http.ResponseWriter, r *http.Request) {
	departmentID := chiURLParam(r, "id")
	var in service.MemberInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	m, err := h.team.CreateMember(r.Context(), departmentID, in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, m)
}

func (h *TeamHandler) UpdateMember(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	var in service.MemberInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	m, err := h.team.UpdateMember(r.Context(), id, in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (h *TeamHandler) DeleteMember(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	if err := h.team.DeleteMember(r.Context(), id); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TeamHandler) UploadMemberPhoto(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}
	file, header, err := r.FormFile("photo")
	if err != nil {
		writeError(w, http.StatusBadRequest, "photo field required")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".webp"
	}
	m, err := h.team.UploadMemberPhoto(r.Context(), id, ext, file, header.Size)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (h *TeamHandler) RemoveMemberPhoto(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	m, err := h.team.RemoveMemberPhoto(r.Context(), id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

type BlogHandler struct {
	blog *service.BlogService
}

func NewBlogHandler(blog *service.BlogService) *BlogHandler {
	return &BlogHandler{blog: blog}
}

func (h *BlogHandler) ListPosts(w http.ResponseWriter, r *http.Request) {
	locale := r.URL.Query().Get("locale")
	posts, err := h.blog.ListPosts(r.Context(), locale)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list posts")
		return
	}
	writeJSON(w, http.StatusOK, posts)
}

func (h *BlogHandler) ListSections(w http.ResponseWriter, r *http.Request) {
	sections, err := h.blog.ListSections(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list sections")
		return
	}
	writeJSON(w, http.StatusOK, sections)
}

func (h *BlogHandler) GetSection(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	sec, err := h.blog.GetSection(r.Context(), id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, sec)
}

func (h *BlogHandler) CreateSection(w http.ResponseWriter, r *http.Request) {
	var in service.BlogSectionInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	sec, err := h.blog.CreateSection(r.Context(), in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, sec)
}

func (h *BlogHandler) UpdateSection(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	var in service.BlogSectionInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	sec, err := h.blog.UpdateSection(r.Context(), id, in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, sec)
}

func (h *BlogHandler) DeleteSection(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	if err := h.blog.DeleteSection(r.Context(), id); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BlogHandler) ReorderSections(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := h.blog.ReorderSections(r.Context(), body.IDs); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BlogHandler) ReorderPosts(w http.ResponseWriter, r *http.Request) {
	sectionID := chiURLParam(r, "id")
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := h.blog.ReorderPosts(r.Context(), sectionID, body.IDs); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BlogHandler) LookupPost(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	locale := r.URL.Query().Get("locale")
	if slug == "" || locale == "" {
		writeError(w, http.StatusBadRequest, "slug and locale are required")
		return
	}
	post, err := h.blog.GetPostBySlug(r.Context(), slug, locale)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (h *BlogHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	post, err := h.blog.GetPost(r.Context(), id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (h *BlogHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	var in service.BlogPostInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	post, err := h.blog.CreatePost(r.Context(), in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, post)
}

func (h *BlogHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	var in service.BlogPostInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	post, err := h.blog.UpdatePost(r.Context(), id, in)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (h *BlogHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	if err := h.blog.DeletePost(r.Context(), id); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BlogHandler) UploadCover(w http.ResponseWriter, r *http.Request) {
	id := chiURLParam(r, "id")
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}
	file, header, err := r.FormFile("cover")
	if err != nil {
		writeError(w, http.StatusBadRequest, "cover field required")
		return
	}
	defer file.Close()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".webp"
	}
	post, err := h.blog.UploadCover(r.Context(), id, ext, file, header.Size)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (h *BlogHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file field required")
		return
	}
	defer file.Close()
	slug := r.FormValue("slug")
	ext := strings.ToLower(filepath.Ext(header.Filename))
	path, err := h.blog.UploadMedia(r.Context(), slug, ext, file, header.Size)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"path": path})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, repository.ErrNotFound):
		writeError(w, http.StatusNotFound, "not found")
	case errors.Is(err, service.ErrValidation):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

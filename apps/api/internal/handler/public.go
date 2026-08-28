package handler

import (
	"errors"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/service"
	"github.com/go-chi/chi/v5"
)

type PublicHandler struct {
	public *service.PublicService
}

func NewPublicHandler(public *service.PublicService) *PublicHandler {
	return &PublicHandler{public: public}
}

func (h *PublicHandler) Team(w http.ResponseWriter, r *http.Request) {
	locale := r.URL.Query().Get("locale")
	data, err := h.public.GetTeam(r.Context(), locale)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load team")
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func (h *PublicHandler) Blog(w http.ResponseWriter, r *http.Request) {
	locale := r.URL.Query().Get("locale")
	data, err := h.public.GetBlog(r.Context(), locale)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load blog")
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func (h *PublicHandler) BlogPost(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	locale := r.URL.Query().Get("locale")
	post, err := h.public.GetBlogPost(r.Context(), slug, locale)
	if err != nil {
		if errors.Is(err, service.ErrNotFoundPublic) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load post")
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (h *PublicHandler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.public.Stats(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load stats")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

type MediaHandler struct {
	uploadDir string
}

func NewMediaHandler(uploadDir string) *MediaHandler {
	return &MediaHandler{uploadDir: uploadDir}
}

func (h *MediaHandler) Serve(w http.ResponseWriter, r *http.Request) {
	path := chi.URLParam(r, "*")
	if path == "" || strings.Contains(path, "..") {
		http.NotFound(w, r)
		return
	}
	full := filepath.Join(h.uploadDir, filepath.FromSlash(path))
	http.ServeFile(w, r, full)
}

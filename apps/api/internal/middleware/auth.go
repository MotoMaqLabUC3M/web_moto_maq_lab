package middleware

import (
	"net/http"
	"strings"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/handler"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/service"
)

type AuthMiddleware struct {
	auth *service.AuthService
}

func NewAuthMiddleware(auth *service.AuthService) *AuthMiddleware {
	return &AuthMiddleware{auth: auth}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := extractToken(r)
		if token == "" {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		user, err := m.auth.ParseToken(token)
		if err != nil {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		ctx := handler.SetUser(r.Context(), user.ID, user.Username, user.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	}
	if cookie, err := r.Cookie("auth_token"); err == nil {
		return cookie.Value
	}
	return ""
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}

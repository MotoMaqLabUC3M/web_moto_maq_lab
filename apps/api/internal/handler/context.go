package handler

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type ctxKey string

const userCtxKey ctxKey = "user"

func chiURLParam(r *http.Request, key string) string {
	return chi.URLParam(r, key)
}

func userFromContext(ctx context.Context) domainUser {
	u, _ := ctx.Value(userCtxKey).(domainUser)
	return u
}

type domainUser struct {
	ID       string
	Username string
	Role     string
}

func SetUser(ctx context.Context, id, username, role string) context.Context {
	return context.WithValue(ctx, userCtxKey, domainUser{ID: id, Username: username, Role: role})
}

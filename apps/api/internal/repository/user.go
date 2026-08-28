package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
)

var ErrNotFound = errors.New("not found")

type UserRepository struct {
	store *Store
}

func NewUserRepository(store *Store) *UserRepository {
	return &UserRepository{store: store}
}

func (r *UserRepository) Count(ctx context.Context) (int, error) {
	var count int
	err := r.store.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}

func (r *UserRepository) Create(ctx context.Context, user domain.User) error {
	query := rebind(`INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)`, r.store.driver)
	_, err := r.store.db.ExecContext(ctx, query, user.ID, user.Username, user.PasswordHash, user.Role, user.CreatedAt)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (domain.User, error) {
	query := rebind(`SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?`, r.store.driver)
	var u domain.User
	err := r.store.db.QueryRowContext(ctx, query, username).Scan(
		&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.User{}, ErrNotFound
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("get user: %w", err)
	}
	return u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	query := rebind(`SELECT id, username, password_hash, role, created_at FROM users WHERE id = ?`, r.store.driver)
	var u domain.User
	err := r.store.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.User{}, ErrNotFound
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}

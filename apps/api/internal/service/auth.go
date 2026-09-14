package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/config"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type AuthService struct {
	users  *repository.UserRepository
	cfg    config.Config
}

func NewAuthService(users *repository.UserRepository, cfg config.Config) *AuthService {
	return &AuthService{users: users, cfg: cfg}
}

type claims struct {
	UserID   string `json:"uid"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) EnsureAdmin(ctx context.Context) error {
	count, err := s.users.Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(s.cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.users.Create(ctx, domain.User{
		ID:           uuid.NewString(),
		Username:     s.cfg.AdminUsername,
		PasswordHash: string(hash),
		Role:         "admin",
		CreatedAt:    time.Now().UTC(),
	})
}

func (s *AuthService) Login(ctx context.Context, username, password string) (domain.AuthResponse, error) {
	user, err := s.users.GetByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.AuthResponse{}, ErrInvalidCredentials
		}
		return domain.AuthResponse{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return domain.AuthResponse{}, ErrInvalidCredentials
	}

	now := time.Now().UTC()
	exp := now.Add(s.cfg.JWTExpiry)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	})

	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return domain.AuthResponse{}, fmt.Errorf("sign token: %w", err)
	}

	user.PasswordHash = ""
	return domain.AuthResponse{
		Token:     signed,
		ExpiresIn: int64(s.cfg.JWTExpiry.Seconds()),
		User:      user,
	}, nil
}

func (s *AuthService) ParseToken(tokenString string) (domain.User, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &claims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return domain.User{}, err
	}

	c, ok := parsed.Claims.(*claims)
	if !ok || !parsed.Valid {
		return domain.User{}, fmt.Errorf("invalid token")
	}

	return domain.User{
		ID:       c.UserID,
		Username: c.Username,
		Role:     c.Role,
	}, nil
}

func (s *AuthService) Me(ctx context.Context, userID string) (domain.User, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return domain.User{}, err
	}
	user.PasswordHash = ""
	return user, nil
}

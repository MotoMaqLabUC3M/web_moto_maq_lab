package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type DBDriver string

const (
	DriverSQLite   DBDriver = "sqlite"
	DriverPostgres DBDriver = "postgres"
)

type Config struct {
	Env                 string
	HTTPAddr            string
	DBDriver            DBDriver
	DatabaseURL         string
	JWTSecret           string
	JWTExpiry           time.Duration
	AdminUsername       string
	AdminPassword       string
	UploadDir           string
	StorageDriver       string
	R2AccountID         string
	R2AccessKeyID       string
	R2SecretAccessKey   string
	R2BucketName        string
	R2PublicURL         string
	PublicAPIBaseURL    string
	CORSOrigins         []string
	MaxUploadMB         int64
}

func Load() (Config, error) {
	loadEnvFiles()

	jwtHours, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "72"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_EXPIRY_HOURS: %w", err)
	}

	maxUpload, err := strconv.ParseInt(getEnv("MAX_UPLOAD_MB", "10"), 10, 64)
	if err != nil {
		return Config{}, fmt.Errorf("MAX_UPLOAD_MB: %w", err)
	}

	driver := DBDriver(strings.ToLower(getEnv("DB_DRIVER", "sqlite")))
	storageDriver := strings.ToLower(getEnv("STORAGE_DRIVER", "local"))
	cfg := Config{
		Env:               getEnv("APP_ENV", "development"),
		HTTPAddr:          getEnv("HTTP_ADDR", ":8080"),
		DBDriver:          driver,
		DatabaseURL:       getEnv("DATABASE_URL", "file:data/motomaqlab.db?_pragma=foreign_keys(1)"),
		JWTSecret:         getEnv("JWT_SECRET", ""),
		JWTExpiry:         time.Duration(jwtHours) * time.Hour,
		AdminUsername:     getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword:     getEnv("ADMIN_PASSWORD", ""),
		UploadDir:         getEnv("UPLOAD_DIR", "./data/uploads"),
		StorageDriver:     storageDriver,
		R2AccountID:       getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2BucketName:      getEnv("R2_BUCKET_NAME", ""),
		R2PublicURL:       getEnv("R2_PUBLIC_URL", ""),
		PublicAPIBaseURL:  getEnv("PUBLIC_API_BASE_URL", "http://localhost:8080"),
		CORSOrigins:       splitCSV(getEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080,https://motomaqlabuc3m.es")),
		MaxUploadMB:       maxUpload,
	}

	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}
	if cfg.AdminPassword == "" {
		return Config{}, fmt.Errorf("ADMIN_PASSWORD is required")
	}
	if cfg.DBDriver != DriverSQLite && cfg.DBDriver != DriverPostgres {
		return Config{}, fmt.Errorf("unsupported DB_DRIVER: %s", cfg.DBDriver)
	}
	if cfg.StorageDriver != "local" && cfg.StorageDriver != "r2" {
		return Config{}, fmt.Errorf("unsupported STORAGE_DRIVER: %s (use local or r2)", cfg.StorageDriver)
	}
	if cfg.StorageDriver == "r2" {
		if cfg.R2AccountID == "" || cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" || cfg.R2BucketName == "" {
			return Config{}, fmt.Errorf("R2 storage requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME")
		}
	}

	return cfg, nil
}

// MediaBaseURL is the public prefix for uploaded files (API /media/ or R2 CDN).
func (c Config) MediaBaseURL() string {
	if c.StorageDriver == "r2" && c.R2PublicURL != "" {
		return strings.TrimSuffix(c.R2PublicURL, "/")
	}
	return strings.TrimSuffix(c.PublicAPIBaseURL, "/") + "/media"
}

// loadEnvFiles carga .env sin sobrescribir variables ya definidas en el sistema.
func loadEnvFiles() {
	candidates := []string{".env"}
	if wd, err := os.Getwd(); err == nil {
		candidates = append(candidates, filepath.Join(wd, ".env"))
		// Monorepo: ejecutar desde raíz o desde apps/api
		candidates = append(candidates,
			filepath.Join(wd, "apps", "api", ".env"),
			filepath.Join(wd, "..", ".env"),
		)
	}
	seen := map[string]bool{}
	for _, path := range candidates {
		if seen[path] {
			continue
		}
		seen[path] = true
		if _, err := os.Stat(path); err != nil {
			continue
		}
		_ = godotenv.Load(path)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

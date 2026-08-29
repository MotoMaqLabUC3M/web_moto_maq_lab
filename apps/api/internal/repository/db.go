package repository

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/config"
	_ "github.com/jackc/pgx/v5/stdlib"
	_ "modernc.org/sqlite"
)

type Store struct {
	db     *sql.DB
	driver config.DBDriver
}

func NewStore(cfg config.Config) (*Store, error) {
	driverName := "sqlite"
	if cfg.DBDriver == config.DriverPostgres {
		driverName = "pgx"
	}

	if cfg.DBDriver == config.DriverSQLite {
		if err := ensureSQLiteDir(cfg.DatabaseURL); err != nil {
			return nil, err
		}
	}

	db, err := sql.Open(driverName, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	store := &Store{db: db, driver: cfg.DBDriver}
	if err := store.Migrate(context.Background()); err != nil {
		return nil, err
	}

	return store, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) DB() *sql.DB {
	return s.db
}

func (s *Store) placeholder(n int) string {
	if s.driver == config.DriverPostgres {
		return fmt.Sprintf("$%d", n)
	}
	return "?"
}

func (s *Store) nowExpr() string {
	if s.driver == config.DriverPostgres {
		return "NOW()"
	}
	return "datetime('now')"
}

func (s *Store) Migrate(ctx context.Context) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'admin',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS departments (
			id TEXT PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			title_es TEXT NOT NULL,
			title_en TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS team_members (
			id TEXT PRIMARY KEY,
			department_id TEXT NOT NULL,
			name TEXT NOT NULL,
			role_es TEXT NOT NULL,
			role_en TEXT NOT NULL DEFAULT '',
			image_path TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS blog_posts (
			id TEXT PRIMARY KEY,
			slug TEXT NOT NULL,
			title TEXT NOT NULL,
			author TEXT NOT NULL DEFAULT '',
			date TEXT NOT NULL,
			category TEXT NOT NULL DEFAULT '',
			cover_image TEXT NOT NULL DEFAULT '',
			excerpt TEXT NOT NULL DEFAULT '',
			blocks TEXT NOT NULL DEFAULT '[]',
			locale TEXT NOT NULL DEFAULT 'es',
			published INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(slug, locale)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department_id)`,
		`CREATE INDEX IF NOT EXISTS idx_blog_posts_locale ON blog_posts(locale)`,
		`CREATE TABLE IF NOT EXISTS blog_sections (
			id TEXT PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			title_es TEXT NOT NULL,
			title_en TEXT NOT NULL DEFAULT '',
			subtitle_es TEXT NOT NULL DEFAULT '',
			subtitle_en TEXT NOT NULL DEFAULT '',
			layout TEXT NOT NULL DEFAULT 'grid',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, stmt := range stmts {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}

	if err := s.ensureBlogPostColumns(ctx); err != nil {
		return err
	}
	if err := s.seedBlogSections(ctx); err != nil {
		return err
	}

	return nil
}

func (s *Store) ensureBlogPostColumns(ctx context.Context) error {
	alters := []string{
		`ALTER TABLE blog_posts ADD COLUMN section_id TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE blog_posts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`,
	}
	for _, stmt := range alters {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate column") {
				continue
			}
			return fmt.Errorf("migrate blog_posts column: %w", err)
		}
	}
	return nil
}

func (s *Store) seedBlogSections(ctx context.Context) error {
	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM blog_sections`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return s.backfillBlogPostSections(ctx)
	}

	now := time.Now().UTC()
	sections := []struct {
		id, slug, titleES, titleEN, subtitleES, subtitleEN, layout string
		sortOrder                                                    int
	}{
		{"sec-noticias", "noticias-recientes", "Noticias Recientes", "Recent News", "Lo último de MOTO-MAQLAB-UC3M", "The latest from MOTO-MAQLAB-UC3M", "grid", 0},
		{"sec-newsletter", "newsletter", "Newsletters", "Newsletters", "Revista MOTO-MAQLAB-UC3M", "MOTO-MAQLAB-UC3M Magazine", "newsletter", 1},
	}

	for _, sec := range sections {
		query := rebind(`INSERT INTO blog_sections (id, slug, title_es, title_en, subtitle_es, subtitle_en, layout, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, s.driver)
		if _, err := s.db.ExecContext(ctx, query, sec.id, sec.slug, sec.titleES, sec.titleEN, sec.subtitleES, sec.subtitleEN, sec.layout, sec.sortOrder, now, now); err != nil {
			return fmt.Errorf("seed blog section: %w", err)
		}
	}

	return s.backfillBlogPostSections(ctx)
}

func (s *Store) backfillBlogPostSections(ctx context.Context) error {
	updates := []struct {
		sectionID string
		match     string
	}{
		{"sec-newsletter", "newsletter"},
		{"sec-noticias", ""},
	}
	for _, u := range updates {
		var query string
		var args []any
		if u.match == "" {
			query = rebind(`UPDATE blog_posts SET section_id = ? WHERE section_id = '' OR section_id IS NULL`, s.driver)
			args = []any{u.sectionID}
		} else {
			query = rebind(`UPDATE blog_posts SET section_id = ? WHERE LOWER(category) = ? AND (section_id = '' OR section_id IS NULL)`, s.driver)
			args = []any{u.sectionID, u.match}
		}
		if _, err := s.db.ExecContext(ctx, query, args...); err != nil {
			return err
		}
	}
	return nil
}

func rebind(query string, driver config.DBDriver) string {
	if driver == config.DriverSQLite {
		return query
	}
	n := 1
	var b strings.Builder
	for _, r := range query {
		if r == '?' {
			b.WriteString(fmt.Sprintf("$%d", n))
			n++
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func ensureSQLiteDir(databaseURL string) error {
	path := databaseURL
	if strings.HasPrefix(path, "file:") {
		path = strings.TrimPrefix(path, "file:")
	}
	if idx := strings.Index(path, "?"); idx >= 0 {
		path = path[:idx]
	}
	dir := filepath.Dir(path)
	if dir == "." || dir == "" {
		return nil
	}
	return os.MkdirAll(dir, 0o755)
}

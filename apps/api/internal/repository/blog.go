package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
)

type BlogRepository struct {
	store *Store
}

func NewBlogRepository(store *Store) *BlogRepository {
	return &BlogRepository{store: store}
}

func (r *BlogRepository) ListPosts(ctx context.Context, locale string, publishedOnly bool) ([]domain.BlogPost, error) {
	query := `SELECT id, slug, title, author, date, category, cover_image, excerpt, blocks, locale, published, section_id, sort_order, created_at, updated_at FROM blog_posts`
	args := []any{}
	if locale != "" {
		query += ` WHERE locale = ?`
		args = append(args, locale)
		if publishedOnly {
			query += ` AND published = 1`
		}
	} else if publishedOnly {
		query += ` WHERE published = 1`
	}
	query += ` ORDER BY sort_order, date DESC, created_at DESC`

	rows, err := r.store.db.QueryContext(ctx, rebind(query, r.store.driver), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanPosts(rows)
}

func (r *BlogRepository) GetPost(ctx context.Context, id string) (domain.BlogPost, error) {
	query := rebind(`SELECT id, slug, title, author, date, category, cover_image, excerpt, blocks, locale, published, section_id, sort_order, created_at, updated_at FROM blog_posts WHERE id = ?`, r.store.driver)
	row := r.store.db.QueryRowContext(ctx, query, id)
	return scanPost(row)
}

func (r *BlogRepository) CreatePost(ctx context.Context, p domain.BlogPost) error {
	blocks, err := json.Marshal(p.Blocks)
	if err != nil {
		return err
	}
	published := 0
	if p.Published {
		published = 1
	}
	query := rebind(`INSERT INTO blog_posts (id, slug, title, author, date, category, cover_image, excerpt, blocks, locale, published, section_id, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, r.store.driver)
	_, err = r.store.db.ExecContext(ctx, query, p.ID, p.Slug, p.Title, p.Author, p.Date, p.Category, p.CoverImage, p.Excerpt, string(blocks), p.Locale, published, p.SectionID, p.SortOrder, p.CreatedAt, p.UpdatedAt)
	return err
}

func (r *BlogRepository) UpdatePost(ctx context.Context, p domain.BlogPost) error {
	blocks, err := json.Marshal(p.Blocks)
	if err != nil {
		return err
	}
	published := 0
	if p.Published {
		published = 1
	}
	query := rebind(`UPDATE blog_posts SET slug=?, title=?, author=?, date=?, category=?, cover_image=?, excerpt=?, blocks=?, locale=?, published=?, section_id=?, sort_order=?, updated_at=? WHERE id=?`, r.store.driver)
	res, err := r.store.db.ExecContext(ctx, query, p.Slug, p.Title, p.Author, p.Date, p.Category, p.CoverImage, p.Excerpt, string(blocks), p.Locale, published, p.SectionID, p.SortOrder, time.Now().UTC(), p.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *BlogRepository) DeletePost(ctx context.Context, id string) error {
	query := rebind(`DELETE FROM blog_posts WHERE id = ?`, r.store.driver)
	res, err := r.store.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *BlogRepository) GetPostBySlug(ctx context.Context, slug, locale string) (domain.BlogPost, error) {
	query := rebind(`SELECT id, slug, title, author, date, category, cover_image, excerpt, blocks, locale, published, section_id, sort_order, created_at, updated_at FROM blog_posts WHERE slug = ? AND locale = ?`, r.store.driver)
	row := r.store.db.QueryRowContext(ctx, query, slug, locale)
	return scanPost(row)
}

func scanPosts(rows *sql.Rows) ([]domain.BlogPost, error) {
	var posts = make([]domain.BlogPost, 0)
	for rows.Next() {
		p, err := scanPostFromRows(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func scanPost(row *sql.Row) (domain.BlogPost, error) {
	var p domain.BlogPost
	var blocksRaw string
	var published int
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.Author, &p.Date, &p.Category, &p.CoverImage, &p.Excerpt, &blocksRaw, &p.Locale, &published, &p.SectionID, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.BlogPost{}, ErrNotFound
	}
	if err != nil {
		return domain.BlogPost{}, err
	}
	p.Published = published == 1
	if blocksRaw != "" {
		_ = json.Unmarshal([]byte(blocksRaw), &p.Blocks)
	}
	return p, nil
}

func scanPostFromRows(rows *sql.Rows) (domain.BlogPost, error) {
	var p domain.BlogPost
	var blocksRaw string
	var published int
	err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Author, &p.Date, &p.Category, &p.CoverImage, &p.Excerpt, &blocksRaw, &p.Locale, &published, &p.SectionID, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return domain.BlogPost{}, err
	}
	p.Published = published == 1
	if blocksRaw != "" {
		_ = json.Unmarshal([]byte(blocksRaw), &p.Blocks)
	}
	return p, nil
}

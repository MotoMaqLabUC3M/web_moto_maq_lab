package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
)

func (r *BlogRepository) ListSections(ctx context.Context) ([]domain.BlogSection, error) {
	query := rebind(`SELECT id, slug, title_es, title_en, subtitle_es, subtitle_en, layout, sort_order, created_at, updated_at FROM blog_sections ORDER BY sort_order, title_es`, r.store.driver)
	rows, err := r.store.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sections []domain.BlogSection
	for rows.Next() {
		var s domain.BlogSection
		if err := rows.Scan(&s.ID, &s.Slug, &s.TitleES, &s.TitleEN, &s.SubtitleES, &s.SubtitleEN, &s.Layout, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sections = append(sections, s)
	}
	return sections, rows.Err()
}

func (r *BlogRepository) GetSection(ctx context.Context, id string) (domain.BlogSection, error) {
	query := rebind(`SELECT id, slug, title_es, title_en, subtitle_es, subtitle_en, layout, sort_order, created_at, updated_at FROM blog_sections WHERE id = ?`, r.store.driver)
	var s domain.BlogSection
	err := r.store.db.QueryRowContext(ctx, query, id).Scan(&s.ID, &s.Slug, &s.TitleES, &s.TitleEN, &s.SubtitleES, &s.SubtitleEN, &s.Layout, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.BlogSection{}, ErrNotFound
	}
	return s, err
}

func (r *BlogRepository) GetSectionBySlug(ctx context.Context, slug string) (domain.BlogSection, error) {
	query := rebind(`SELECT id, slug, title_es, title_en, subtitle_es, subtitle_en, layout, sort_order, created_at, updated_at FROM blog_sections WHERE slug = ?`, r.store.driver)
	var s domain.BlogSection
	err := r.store.db.QueryRowContext(ctx, query, slug).Scan(&s.ID, &s.Slug, &s.TitleES, &s.TitleEN, &s.SubtitleES, &s.SubtitleEN, &s.Layout, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.BlogSection{}, ErrNotFound
	}
	return s, err
}

func (r *BlogRepository) CreateSection(ctx context.Context, s domain.BlogSection) error {
	query := rebind(`INSERT INTO blog_sections (id, slug, title_es, title_en, subtitle_es, subtitle_en, layout, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, r.store.driver)
	_, err := r.store.db.ExecContext(ctx, query, s.ID, s.Slug, s.TitleES, s.TitleEN, s.SubtitleES, s.SubtitleEN, s.Layout, s.SortOrder, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *BlogRepository) UpdateSection(ctx context.Context, s domain.BlogSection) error {
	query := rebind(`UPDATE blog_sections SET slug=?, title_es=?, title_en=?, subtitle_es=?, subtitle_en=?, layout=?, sort_order=?, updated_at=? WHERE id=?`, r.store.driver)
	res, err := r.store.db.ExecContext(ctx, query, s.Slug, s.TitleES, s.TitleEN, s.SubtitleES, s.SubtitleEN, s.Layout, s.SortOrder, time.Now().UTC(), s.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *BlogRepository) DeleteSection(ctx context.Context, id string) error {
	query := rebind(`DELETE FROM blog_sections WHERE id = ?`, r.store.driver)
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

func (r *BlogRepository) ListPostsBySection(ctx context.Context, sectionID string) ([]domain.BlogPost, error) {
	query := rebind(`SELECT id, slug, title, author, date, category, cover_image, excerpt, blocks, locale, published, section_id, sort_order, created_at, updated_at FROM blog_posts WHERE section_id = ? ORDER BY sort_order, date DESC, created_at DESC`, r.store.driver)
	rows, err := r.store.db.QueryContext(ctx, query, sectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

func (r *BlogRepository) CountSections(ctx context.Context) (int, error) {
	var n int
	err := r.store.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM blog_sections`).Scan(&n)
	return n, err
}

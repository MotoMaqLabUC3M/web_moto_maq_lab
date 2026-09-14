package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
)

type TeamRepository struct {
	store *Store
}

func NewTeamRepository(store *Store) *TeamRepository {
	return &TeamRepository{store: store}
}

func (r *TeamRepository) ListDepartments(ctx context.Context) ([]domain.Department, error) {
	query := rebind(`SELECT id, slug, title_es, title_en, sort_order, created_at, updated_at FROM departments ORDER BY sort_order, title_es`, r.store.driver)
	rows, err := r.store.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list departments: %w", err)
	}
	defer rows.Close()

	var deps = make([]domain.Department, 0)
	for rows.Next() {
		var d domain.Department
		if err := rows.Scan(&d.ID, &d.Slug, &d.TitleES, &d.TitleEN, &d.SortOrder, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		deps = append(deps, d)
	}
	return deps, rows.Err()
}

func (r *TeamRepository) GetDepartment(ctx context.Context, id string) (domain.Department, error) {
	query := rebind(`SELECT id, slug, title_es, title_en, sort_order, created_at, updated_at FROM departments WHERE id = ?`, r.store.driver)
	var d domain.Department
	err := r.store.db.QueryRowContext(ctx, query, id).Scan(
		&d.ID, &d.Slug, &d.TitleES, &d.TitleEN, &d.SortOrder, &d.CreatedAt, &d.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Department{}, ErrNotFound
	}
	return d, err
}

func (r *TeamRepository) CreateDepartment(ctx context.Context, d domain.Department) error {
	query := rebind(`INSERT INTO departments (id, slug, title_es, title_en, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, r.store.driver)
	_, err := r.store.db.ExecContext(ctx, query, d.ID, d.Slug, d.TitleES, d.TitleEN, d.SortOrder, d.CreatedAt, d.UpdatedAt)
	return err
}

func (r *TeamRepository) UpdateDepartment(ctx context.Context, d domain.Department) error {
	query := rebind(`UPDATE departments SET slug=?, title_es=?, title_en=?, sort_order=?, updated_at=? WHERE id=?`, r.store.driver)
	res, err := r.store.db.ExecContext(ctx, query, d.Slug, d.TitleES, d.TitleEN, d.SortOrder, time.Now().UTC(), d.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *TeamRepository) DeleteDepartment(ctx context.Context, id string) error {
	query := rebind(`DELETE FROM departments WHERE id = ?`, r.store.driver)
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

func (r *TeamRepository) ListMembersByDepartment(ctx context.Context, departmentID string) ([]domain.TeamMember, error) {
	query := rebind(`SELECT id, department_id, name, role_es, role_en, image_path, sort_order, created_at, updated_at FROM team_members WHERE department_id = ? ORDER BY sort_order, name`, r.store.driver)
	rows, err := r.store.db.QueryContext(ctx, query, departmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members = make([]domain.TeamMember, 0)
	for rows.Next() {
		var m domain.TeamMember
		if err := rows.Scan(&m.ID, &m.DepartmentID, &m.Name, &m.RoleES, &m.RoleEN, &m.ImagePath, &m.SortOrder, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

func (r *TeamRepository) ListAllMembers(ctx context.Context) ([]domain.TeamMember, error) {
	query := rebind(`SELECT id, department_id, name, role_es, role_en, image_path, sort_order, created_at, updated_at FROM team_members ORDER BY sort_order, name`, r.store.driver)
	rows, err := r.store.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members = make([]domain.TeamMember, 0)
	for rows.Next() {
		var m domain.TeamMember
		if err := rows.Scan(&m.ID, &m.DepartmentID, &m.Name, &m.RoleES, &m.RoleEN, &m.ImagePath, &m.SortOrder, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

func (r *TeamRepository) GetMember(ctx context.Context, id string) (domain.TeamMember, error) {
	query := rebind(`SELECT id, department_id, name, role_es, role_en, image_path, sort_order, created_at, updated_at FROM team_members WHERE id = ?`, r.store.driver)
	var m domain.TeamMember
	err := r.store.db.QueryRowContext(ctx, query, id).Scan(
		&m.ID, &m.DepartmentID, &m.Name, &m.RoleES, &m.RoleEN, &m.ImagePath, &m.SortOrder, &m.CreatedAt, &m.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.TeamMember{}, ErrNotFound
	}
	return m, err
}

func (r *TeamRepository) CreateMember(ctx context.Context, m domain.TeamMember) error {
	query := rebind(`INSERT INTO team_members (id, department_id, name, role_es, role_en, image_path, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, r.store.driver)
	_, err := r.store.db.ExecContext(ctx, query, m.ID, m.DepartmentID, m.Name, m.RoleES, m.RoleEN, m.ImagePath, m.SortOrder, m.CreatedAt, m.UpdatedAt)
	return err
}

func (r *TeamRepository) UpdateMember(ctx context.Context, m domain.TeamMember) error {
	query := rebind(`UPDATE team_members SET department_id=?, name=?, role_es=?, role_en=?, image_path=?, sort_order=?, updated_at=? WHERE id=?`, r.store.driver)
	res, err := r.store.db.ExecContext(ctx, query, m.DepartmentID, m.Name, m.RoleES, m.RoleEN, m.ImagePath, m.SortOrder, time.Now().UTC(), m.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *TeamRepository) DeleteMember(ctx context.Context, id string) error {
	query := rebind(`DELETE FROM team_members WHERE id = ?`, r.store.driver)
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

func (r *TeamRepository) GetDepartmentBySlug(ctx context.Context, slug string) (domain.Department, error) {
	query := rebind(`SELECT id, slug, title_es, title_en, sort_order, created_at, updated_at FROM departments WHERE slug = ?`, r.store.driver)
	var d domain.Department
	err := r.store.db.QueryRowContext(ctx, query, slug).Scan(
		&d.ID, &d.Slug, &d.TitleES, &d.TitleEN, &d.SortOrder, &d.CreatedAt, &d.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Department{}, ErrNotFound
	}
	return d, err
}

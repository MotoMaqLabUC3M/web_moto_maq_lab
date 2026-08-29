package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/external/publicformat"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/external/storage"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
	"github.com/google/uuid"
)

var ErrValidation = errors.New("validation error")

type TeamService struct {
	repo    *repository.TeamRepository
	storage *storage.StorageService
}

func NewTeamService(repo *repository.TeamRepository, storage *storage.StorageService) *TeamService {
	return &TeamService{repo: repo, storage: storage}
}

type DepartmentInput struct {
	Slug      string `json:"slug"`
	TitleES   string `json:"title_es"`
	TitleEN   string `json:"title_en"`
	SortOrder int    `json:"sort_order"`
}

type MemberInput struct {
	DepartmentID string `json:"department_id"`
	Name         string `json:"name"`
	RoleES       string `json:"role_es"`
	RoleEN       string `json:"role_en"`
	SortOrder    int    `json:"sort_order"`
}

func (s *TeamService) ListDepartments(ctx context.Context) ([]domain.Department, error) {
	deps, err := s.repo.ListDepartments(ctx)
	if err != nil {
		return nil, err
	}
	for i := range deps {
		members, err := s.repo.ListMembersByDepartment(ctx, deps[i].ID)
		if err != nil {
			return nil, err
		}
		deps[i].Members = members
	}
	return deps, nil
}

func (s *TeamService) CreateDepartment(ctx context.Context, in DepartmentInput) (domain.Department, error) {
	slug := in.Slug
	if slug == "" {
		slug = publicformat.Slugify(in.TitleES)
	}
	if slug == "" {
		return domain.Department{}, fmt.Errorf("%w: slug is required", ErrValidation)
	}

	now := time.Now().UTC()
	d := domain.Department{
		ID:        uuid.NewString(),
		Slug:      slug,
		TitleES:   in.TitleES,
		TitleEN:   in.TitleEN,
		SortOrder: in.SortOrder,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.repo.CreateDepartment(ctx, d); err != nil {
		return domain.Department{}, err
	}
	return d, nil
}

func (s *TeamService) UpdateDepartment(ctx context.Context, id string, in DepartmentInput) (domain.Department, error) {
	d, err := s.repo.GetDepartment(ctx, id)
	if err != nil {
		return domain.Department{}, err
	}
	if in.Slug != "" {
		d.Slug = in.Slug
	}
	if in.TitleES != "" {
		d.TitleES = in.TitleES
	}
	d.TitleEN = in.TitleEN
	d.SortOrder = in.SortOrder
	if err := s.repo.UpdateDepartment(ctx, d); err != nil {
		return domain.Department{}, err
	}
	return d, nil
}

func (s *TeamService) DeleteDepartment(ctx context.Context, id string) error {
	return s.repo.DeleteDepartment(ctx, id)
}

func (s *TeamService) ReorderDepartments(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	for i, id := range ids {
		d, err := s.repo.GetDepartment(ctx, id)
		if err != nil {
			return err
		}
		d.SortOrder = i
		if err := s.repo.UpdateDepartment(ctx, d); err != nil {
			return err
		}
	}
	return nil
}

func (s *TeamService) ReorderMembers(ctx context.Context, departmentID string, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	if _, err := s.repo.GetDepartment(ctx, departmentID); err != nil {
		return err
	}
	for i, id := range ids {
		m, err := s.repo.GetMember(ctx, id)
		if err != nil {
			return err
		}
		if m.DepartmentID != departmentID {
			return fmt.Errorf("%w: member does not belong to department", ErrValidation)
		}
		m.SortOrder = i
		if err := s.repo.UpdateMember(ctx, m); err != nil {
			return err
		}
	}
	return nil
}

func (s *TeamService) CreateMember(ctx context.Context, departmentID string, in MemberInput) (domain.TeamMember, error) {
	if _, err := s.repo.GetDepartment(ctx, departmentID); err != nil {
		return domain.TeamMember{}, err
	}
	if strings.TrimSpace(in.Name) == "" {
		return domain.TeamMember{}, fmt.Errorf("%w: name is required", ErrValidation)
	}

	now := time.Now().UTC()
	m := domain.TeamMember{
		ID:           uuid.NewString(),
		DepartmentID: departmentID,
		Name:         in.Name,
		RoleES:       in.RoleES,
		RoleEN:       in.RoleEN,
		SortOrder:    in.SortOrder,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.repo.CreateMember(ctx, m); err != nil {
		return domain.TeamMember{}, err
	}
	return m, nil
}

func (s *TeamService) UpdateMember(ctx context.Context, id string, in MemberInput) (domain.TeamMember, error) {
	m, err := s.repo.GetMember(ctx, id)
	if err != nil {
		return domain.TeamMember{}, err
	}
	if in.DepartmentID != "" {
		if _, err := s.repo.GetDepartment(ctx, in.DepartmentID); err != nil {
			return domain.TeamMember{}, err
		}
		m.DepartmentID = in.DepartmentID
	}
	if in.Name != "" {
		m.Name = in.Name
	}
	m.RoleES = in.RoleES
	m.RoleEN = in.RoleEN
	m.SortOrder = in.SortOrder
	if err := s.repo.UpdateMember(ctx, m); err != nil {
		return domain.TeamMember{}, err
	}
	return m, nil
}

func (s *TeamService) DeleteMember(ctx context.Context, id string) error {
	m, err := s.repo.GetMember(ctx, id)
	if err != nil {
		return err
	}
	if err := s.storage.Delete(m.ImagePath); err != nil {
		return err
	}
	return s.repo.DeleteMember(ctx, id)
}

func (s *TeamService) UploadMemberPhoto(ctx context.Context, memberID, ext string, r io.Reader, size int64) (domain.TeamMember, error) {
	m, err := s.repo.GetMember(ctx, memberID)
	if err != nil {
		return domain.TeamMember{}, err
	}
	dep, err := s.repo.GetDepartment(ctx, m.DepartmentID)
	if err != nil {
		return domain.TeamMember{}, err
	}

	filename := publicformat.Slugify(m.Name)
	if filename == "" {
		filename = memberID
	}
	relative := fmt.Sprintf("team/%s/%s%s", dep.Slug, filename, ext)
	if m.ImagePath != "" && m.ImagePath != relative {
		_ = s.storage.Delete(m.ImagePath)
	}

	path, err := s.storage.Save(relative, r, size)
	if err != nil {
		return domain.TeamMember{}, err
	}
	m.ImagePath = path
	if err := s.repo.UpdateMember(ctx, m); err != nil {
		return domain.TeamMember{}, err
	}
	return m, nil
}

func (s *TeamService) RemoveMemberPhoto(ctx context.Context, memberID string) (domain.TeamMember, error) {
	m, err := s.repo.GetMember(ctx, memberID)
	if err != nil {
		return domain.TeamMember{}, err
	}
	if err := s.storage.Delete(m.ImagePath); err != nil {
		return domain.TeamMember{}, err
	}
	m.ImagePath = ""
	if err := s.repo.UpdateMember(ctx, m); err != nil {
		return domain.TeamMember{}, err
	}
	return m, nil
}

func (s *TeamService) AllMembers(ctx context.Context) ([]domain.TeamMember, error) {
	return s.repo.ListAllMembers(ctx)
}

func (s *TeamService) AllDepartments(ctx context.Context) ([]domain.Department, error) {
	return s.repo.ListDepartments(ctx)
}

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

type BlogService struct {
	repo    *repository.BlogRepository
	storage *storage.StorageService
}

func NewBlogService(repo *repository.BlogRepository, storage *storage.StorageService) *BlogService {
	return &BlogService{repo: repo, storage: storage}
}

type BlogPostInput struct {
	Slug       string             `json:"slug"`
	Title      string             `json:"title"`
	Author     string             `json:"author"`
	Date       string             `json:"date"`
	Category   string             `json:"category"`
	CoverImage string             `json:"cover_image"`
	Excerpt    string             `json:"excerpt"`
	Blocks     []domain.BlogBlock `json:"blocks"`
	Locale     string             `json:"locale"`
	Published  bool               `json:"published"`
	SectionID  string             `json:"section_id"`
	SortOrder  int                `json:"sort_order"`
}

type BlogSectionInput struct {
	Slug       string `json:"slug"`
	TitleES    string `json:"title_es"`
	TitleEN    string `json:"title_en"`
	SubtitleES string `json:"subtitle_es"`
	SubtitleEN string `json:"subtitle_en"`
	Layout     string `json:"layout"`
	SortOrder  int    `json:"sort_order"`
}

func (s *BlogService) ListSections(ctx context.Context) ([]domain.BlogSection, error) {
	sections, err := s.repo.ListSections(ctx)
	if err != nil {
		return nil, err
	}
	for i := range sections {
		posts, err := s.repo.ListPostsBySection(ctx, sections[i].ID)
		if err != nil {
			return nil, err
		}
		sections[i].Posts = posts
	}
	return sections, nil
}

func (s *BlogService) GetSection(ctx context.Context, id string) (domain.BlogSection, error) {
	sec, err := s.repo.GetSection(ctx, id)
	if err != nil {
		return domain.BlogSection{}, err
	}
	posts, err := s.repo.ListPostsBySection(ctx, id)
	if err != nil {
		return domain.BlogSection{}, err
	}
	sec.Posts = posts
	return sec, nil
}

func (s *BlogService) CreateSection(ctx context.Context, in BlogSectionInput) (domain.BlogSection, error) {
	if strings.TrimSpace(in.TitleES) == "" {
		return domain.BlogSection{}, fmt.Errorf("%w: title_es is required", ErrValidation)
	}
	slug := in.Slug
	if slug == "" {
		slug = publicformat.Slugify(in.TitleES)
	}
	layout := in.Layout
	if layout == "" {
		layout = "grid"
	}
	now := time.Now().UTC()
	sec := domain.BlogSection{
		ID:         uuid.NewString(),
		Slug:       slug,
		TitleES:    in.TitleES,
		TitleEN:    in.TitleEN,
		SubtitleES: in.SubtitleES,
		SubtitleEN: in.SubtitleEN,
		Layout:     layout,
		SortOrder:  in.SortOrder,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := s.repo.CreateSection(ctx, sec); err != nil {
		return domain.BlogSection{}, err
	}
	return sec, nil
}

func (s *BlogService) UpdateSection(ctx context.Context, id string, in BlogSectionInput) (domain.BlogSection, error) {
	sec, err := s.repo.GetSection(ctx, id)
	if err != nil {
		return domain.BlogSection{}, err
	}
	if in.Slug != "" {
		sec.Slug = in.Slug
	}
	if in.TitleES != "" {
		sec.TitleES = in.TitleES
	}
	sec.TitleEN = in.TitleEN
	sec.SubtitleES = in.SubtitleES
	sec.SubtitleEN = in.SubtitleEN
	if in.Layout != "" {
		sec.Layout = in.Layout
	}
	if err := s.repo.UpdateSection(ctx, sec); err != nil {
		return domain.BlogSection{}, err
	}
	return sec, nil
}

func (s *BlogService) DeleteSection(ctx context.Context, id string) error {
	posts, err := s.repo.ListPostsBySection(ctx, id)
	if err != nil {
		return err
	}
	if len(posts) > 0 {
		return fmt.Errorf("%w: section has posts", ErrValidation)
	}
	return s.repo.DeleteSection(ctx, id)
}

func (s *BlogService) ReorderSections(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	for i, id := range ids {
		sec, err := s.repo.GetSection(ctx, id)
		if err != nil {
			return err
		}
		sec.SortOrder = i
		if err := s.repo.UpdateSection(ctx, sec); err != nil {
			return err
		}
	}
	return nil
}

func (s *BlogService) ReorderPosts(ctx context.Context, sectionID string, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	if _, err := s.repo.GetSection(ctx, sectionID); err != nil {
		return err
	}
	sectionPosts, err := s.repo.ListPostsBySection(ctx, sectionID)
	if err != nil {
		return err
	}
	bySlug := map[string][]domain.BlogPost{}
	for _, p := range sectionPosts {
		bySlug[p.Slug] = append(bySlug[p.Slug], p)
	}

	seen := map[string]bool{}
	order := 0
	for _, id := range ids {
		p, err := s.repo.GetPost(ctx, id)
		if err != nil {
			return err
		}
		if p.SectionID != sectionID {
			return fmt.Errorf("%w: post does not belong to section", ErrValidation)
		}
		if seen[p.Slug] {
			continue
		}
		seen[p.Slug] = true
		for _, sibling := range bySlug[p.Slug] {
			sibling.SortOrder = order
			if err := s.repo.UpdatePost(ctx, sibling); err != nil {
				return err
			}
		}
		order++
	}
	return nil
}

func (s *BlogService) defaultSectionID(ctx context.Context) (string, error) {
	sections, err := s.repo.ListSections(ctx)
	if err != nil {
		return "", err
	}
	if len(sections) == 0 {
		return "", fmt.Errorf("%w: no blog sections configured", ErrValidation)
	}
	return sections[0].ID, nil
}

func (s *BlogService) ListPosts(ctx context.Context, locale string) ([]domain.BlogPost, error) {
	return s.repo.ListPosts(ctx, locale, false)
}

func (s *BlogService) GetPost(ctx context.Context, id string) (domain.BlogPost, error) {
	return s.repo.GetPost(ctx, id)
}

func (s *BlogService) GetPostBySlug(ctx context.Context, slug, locale string) (domain.BlogPost, error) {
	if locale == "" {
		locale = "es"
	}
	return s.repo.GetPostBySlug(ctx, slug, locale)
}

func (s *BlogService) CreatePost(ctx context.Context, in BlogPostInput) (domain.BlogPost, error) {
	if strings.TrimSpace(in.Title) == "" {
		return domain.BlogPost{}, fmt.Errorf("%w: title is required", ErrValidation)
	}
	slug := in.Slug
	if slug == "" {
		slug = publicformat.Slugify(in.Title)
	}
	locale := in.Locale
	if locale == "" {
		locale = "es"
	}
	if _, err := s.repo.GetPostBySlug(ctx, slug, locale); err == nil {
		return domain.BlogPost{}, fmt.Errorf("%w: ya existe una entrada con este slug en %s", ErrValidation, locale)
	} else if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return domain.BlogPost{}, err
	}
	date := in.Date
	if date == "" {
		date = time.Now().UTC().Format("2006-01-02")
	}

	now := time.Now().UTC()
	sectionID := in.SectionID
	if sectionID == "" {
		var err error
		sectionID, err = s.defaultSectionID(ctx)
		if err != nil {
			return domain.BlogPost{}, err
		}
	} else if _, err := s.repo.GetSection(ctx, sectionID); err != nil {
		return domain.BlogPost{}, err
	}
	existing, _ := s.repo.ListPostsBySection(ctx, sectionID)
	sortOrder := in.SortOrder
	if sortOrder == 0 && len(existing) > 0 {
		sortOrder = len(existing)
	}

	p := domain.BlogPost{
		ID:         uuid.NewString(),
		Slug:       slug,
		Title:      in.Title,
		Author:     in.Author,
		Date:       date,
		Category:   in.Category,
		CoverImage: in.CoverImage,
		Excerpt:    in.Excerpt,
		Blocks:     in.Blocks,
		Locale:     locale,
		Published:  in.Published,
		SectionID:  sectionID,
		SortOrder:  sortOrder,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := s.repo.CreatePost(ctx, p); err != nil {
		return domain.BlogPost{}, err
	}
	return p, nil
}

func (s *BlogService) UpdatePost(ctx context.Context, id string, in BlogPostInput) (domain.BlogPost, error) {
	p, err := s.repo.GetPost(ctx, id)
	if err != nil {
		return domain.BlogPost{}, err
	}
	if in.Slug != "" {
		p.Slug = in.Slug
	}
	if in.Title != "" {
		p.Title = in.Title
	}
	p.Author = in.Author
	if in.Date != "" {
		p.Date = in.Date
	}
	p.Category = in.Category
	p.CoverImage = in.CoverImage
	p.Excerpt = in.Excerpt
	if in.SectionID != "" {
		if _, err := s.repo.GetSection(ctx, in.SectionID); err != nil {
			return domain.BlogPost{}, err
		}
		p.SectionID = in.SectionID
	}
	if in.Blocks != nil {
		p.Blocks = in.Blocks
	}
	p.Published = in.Published
	if err := s.repo.UpdatePost(ctx, p); err != nil {
		return domain.BlogPost{}, err
	}
	return p, nil
}

func (s *BlogService) DeletePost(ctx context.Context, id string) error {
	return s.repo.DeletePost(ctx, id)
}

func (s *BlogService) UploadCover(ctx context.Context, postID, ext string, r io.Reader, size int64) (domain.BlogPost, error) {
	p, err := s.repo.GetPost(ctx, postID)
	if err != nil {
		return domain.BlogPost{}, err
	}
	relative := fmt.Sprintf("blog/%s/cover%s", p.Slug, ext)
	if p.CoverImage != "" && p.CoverImage != relative {
		_ = s.storage.Delete(p.CoverImage)
	}
	path, err := s.storage.Save(relative, r, size)
	if err != nil {
		return domain.BlogPost{}, err
	}
	p.CoverImage = path
	if err := s.repo.UpdatePost(ctx, p); err != nil {
		return domain.BlogPost{}, err
	}
	return p, nil
}

func (s *BlogService) UploadMedia(ctx context.Context, slug, ext string, r io.Reader, size int64) (string, error) {
	if slug == "" {
		slug = uuid.NewString()
	}
	filename := fmt.Sprintf("%s-%d%s", slug, time.Now().Unix(), ext)
	relative := fmt.Sprintf("blog/%s/%s", slug, filename)
	return s.storage.Save(relative, r, size)
}

func (s *BlogService) PublishedByLocale(ctx context.Context, locale string) ([]domain.BlogPost, error) {
	return s.repo.ListPosts(ctx, locale, true)
}

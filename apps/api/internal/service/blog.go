package service

import (
	"context"
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
	Slug       string            `json:"slug"`
	Title      string            `json:"title"`
	Author     string            `json:"author"`
	Date       string            `json:"date"`
	Category   string            `json:"category"`
	CoverImage string            `json:"cover_image"`
	Excerpt    string            `json:"excerpt"`
	Blocks     []domain.BlogBlock `json:"blocks"`
	Locale     string            `json:"locale"`
	Published  bool              `json:"published"`
}

func (s *BlogService) ListPosts(ctx context.Context, locale string) ([]domain.BlogPost, error) {
	return s.repo.ListPosts(ctx, locale, false)
}

func (s *BlogService) GetPost(ctx context.Context, id string) (domain.BlogPost, error) {
	return s.repo.GetPost(ctx, id)
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
	date := in.Date
	if date == "" {
		date = time.Now().UTC().Format("2006-01-02")
	}

	now := time.Now().UTC()
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
	if in.Blocks != nil {
		p.Blocks = in.Blocks
	}
	if in.Locale != "" {
		p.Locale = in.Locale
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

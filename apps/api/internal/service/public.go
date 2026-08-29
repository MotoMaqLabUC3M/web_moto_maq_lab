package service

import (
	"context"
	"errors"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/external/publicformat"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
)

var ErrNotFoundPublic = errors.New("not found")

type PublicService struct {
	team      *TeamService
	blog      *repository.BlogRepository
	mediaBase string
}

func NewPublicService(team *TeamService, blog *repository.BlogRepository, publicAPIBaseURL string) *PublicService {
	return &PublicService{
		team:      team,
		blog:      blog,
		mediaBase: publicAPIBaseURL,
	}
}

func (s *PublicService) GetTeam(ctx context.Context, locale string) (publicformat.TeamResponse, error) {
	if locale == "" {
		locale = "es"
	}
	deps, err := s.team.AllDepartments(ctx)
	if err != nil {
		return publicformat.TeamResponse{}, err
	}
	members, err := s.team.AllMembers(ctx)
	if err != nil {
		return publicformat.TeamResponse{}, err
	}
	return publicformat.BuildTeam(deps, members, locale, s.mediaBase), nil
}

func (s *PublicService) GetBlog(ctx context.Context, locale string) (publicformat.BlogResponse, error) {
	if locale == "" {
		locale = "es"
	}
	sections, err := s.blog.ListSections(ctx)
	if err != nil {
		return publicformat.BlogResponse{}, err
	}
	for i := range sections {
		posts, err := s.blog.ListPostsBySection(ctx, sections[i].ID)
		if err != nil {
			return publicformat.BlogResponse{}, err
		}
		sections[i].Posts = posts
	}
	return publicformat.BuildBlog(sections, locale, s.mediaBase), nil
}

func (s *PublicService) GetBlogPost(ctx context.Context, slug, locale string) (publicformat.BlogPost, error) {
	if locale == "" {
		locale = "es"
	}
	post, err := s.blog.GetPostBySlug(ctx, slug, locale)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return publicformat.BlogPost{}, ErrNotFoundPublic
		}
		return publicformat.BlogPost{}, err
	}
	if !post.Published {
		return publicformat.BlogPost{}, ErrNotFoundPublic
	}
	return publicformat.BuildBlogPost(post, s.mediaBase), nil
}

func (s *PublicService) Stats(ctx context.Context) (map[string]int, error) {
	deps, err := s.team.AllDepartments(ctx)
	if err != nil {
		return nil, err
	}
	members, err := s.team.AllMembers(ctx)
	if err != nil {
		return nil, err
	}
	posts, err := s.blog.ListPosts(ctx, "", false)
	if err != nil {
		return nil, err
	}
	slugPublished := map[string]bool{}
	for _, p := range posts {
		if p.Published {
			slugPublished[p.Slug] = true
		}
	}
	publishedArticles := len(slugPublished)
	uniqueSlugs := map[string]struct{}{}
	for _, p := range posts {
		uniqueSlugs[p.Slug] = struct{}{}
	}
	return map[string]int{
		"departments": len(deps),
		"members":     len(members),
		"posts":       len(uniqueSlugs),
		"published":   publishedArticles,
	}, nil
}

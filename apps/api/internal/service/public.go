package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/external/publicformat"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/seo"
)

var ErrNotFoundPublic = errors.New("not found")

type PublicService struct {
	team       *TeamService
	blog       *repository.BlogRepository
	mediaBase  string
	siteOrigin string
}

func NewPublicService(team *TeamService, blog *repository.BlogRepository, mediaBase, siteOrigin string) *PublicService {
	return &PublicService{
		team:       team,
		blog:       blog,
		mediaBase:  mediaBase,
		siteOrigin: strings.TrimSuffix(siteOrigin, "/"),
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

func (s *PublicService) SiteOrigin() string {
	if s.siteOrigin != "" {
		return s.siteOrigin
	}
	return "https://motomaqlabuc3m.es"
}

func (s *PublicService) GetPublishedPost(ctx context.Context, slug, locale string) (domain.BlogPost, error) {
	if locale == "" {
		locale = "es"
	}
	post, err := s.blog.GetPostBySlug(ctx, slug, locale)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return domain.BlogPost{}, ErrNotFoundPublic
		}
		return domain.BlogPost{}, err
	}
	if !post.Published {
		return domain.BlogPost{}, ErrNotFoundPublic
	}
	return post, nil
}

func (s *PublicService) HasPublishedLocale(ctx context.Context, slug, locale string) bool {
	_, err := s.GetPublishedPost(ctx, slug, locale)
	return err == nil
}

func (s *PublicService) BuildSitemap(ctx context.Context) ([]byte, error) {
	posts, err := s.blog.ListPosts(ctx, "", true)
	if err != nil {
		return nil, err
	}

	published := map[string]map[string]domain.BlogPost{}
	for _, p := range posts {
		if !p.Published {
			continue
		}
		if published[p.Slug] == nil {
			published[p.Slug] = map[string]domain.BlogPost{}
		}
		published[p.Slug][p.Locale] = p
	}

	var urls []seo.BlogURL
	for slug, byLocale := range published {
		_, hasES := byLocale["es"]
		_, hasEN := byLocale["en"]
		for locale, p := range byLocale {
			exported := publicformat.BuildBlogPost(p, s.mediaBase)
			lastmod := p.UpdatedAt
			if lastmod.IsZero() {
				if t, err := time.Parse("2006-01-02", p.Date); err == nil {
					lastmod = t
				}
			}
			urls = append(urls, seo.BlogURL{
				Slug:     slug,
				Locale:   locale,
				LastMod:  lastmod,
				Image:    exported.Imagen,
				ImageAlt: exported.Titulo,
				HasES:    hasES,
				HasEN:    hasEN,
				Skip:     seo.IsNewsletter(p.Category, exported.Contenido),
			})
		}
	}
	return seo.BuildSitemap(s.SiteOrigin(), urls)
}

func (s *PublicService) RenderArticleHTML(ctx context.Context, slug, locale string) ([]byte, error) {
	post, err := s.GetPublishedPost(ctx, slug, locale)
	if err != nil {
		return nil, err
	}
	return seo.RenderArticle(seo.ArticleInput{
		Origin:    s.SiteOrigin(),
		Locale:    locale,
		Post:      post,
		MediaBase: s.mediaBase,
		HasES:     s.HasPublishedLocale(ctx, slug, "es"),
		HasEN:     s.HasPublishedLocale(ctx, slug, "en"),
	})
}

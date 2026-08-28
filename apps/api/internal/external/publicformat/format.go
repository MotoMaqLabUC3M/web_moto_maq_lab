package publicformat

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
)

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func Slugify(input string) string {
	s := strings.ToLower(strings.TrimSpace(input))
	s = slugRe.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

type TeamSection struct {
	ID      string       `json:"id"`
	Title   string       `json:"title"`
	Members []TeamMember `json:"members"`
}

type TeamMember struct {
	Name  string `json:"name"`
	Role  string `json:"role"`
	Image string `json:"image,omitempty"`
}

type TeamResponse struct {
	Sections []TeamSection `json:"sections"`
}

type BlogPost struct {
	ID        string `json:"id"`
	Titulo    string `json:"titulo"`
	Autor     string `json:"autor"`
	Fecha     string `json:"fecha"`
	Categoria string `json:"categoria"`
	Imagen    string `json:"imagen,omitempty"`
	Extracto  string `json:"extracto"`
	Contenido string `json:"contenido"`
}

type BlogResponse struct {
	Posts []BlogPost `json:"posts"`
}

func BuildTeam(departments []domain.Department, members []domain.TeamMember, locale string, mediaBase string) TeamResponse {
	membersByDept := map[string][]domain.TeamMember{}
	for _, m := range members {
		membersByDept[m.DepartmentID] = append(membersByDept[m.DepartmentID], m)
	}

	sections := make([]TeamSection, 0, len(departments))
	for _, d := range departments {
		title := d.TitleES
		if locale == "en" {
			title = firstNonEmpty(d.TitleEN, d.TitleES)
		}
		sec := TeamSection{ID: d.Slug, Title: title}
		for _, m := range membersByDept[d.ID] {
			role := m.RoleES
			if locale == "en" {
				role = firstNonEmpty(m.RoleEN, m.RoleES)
			}
			sec.Members = append(sec.Members, TeamMember{
				Name:  m.Name,
				Role:  role,
				Image: ResolveMediaURL(mediaBase, m.ImagePath),
			})
		}
		sections = append(sections, sec)
	}
	return TeamResponse{Sections: sections}
}

func BuildBlog(posts []domain.BlogPost, locale string, mediaBase string) BlogResponse {
	exported := make([]BlogPost, 0, len(posts))
	for _, p := range posts {
		if p.Locale != locale || !p.Published {
			continue
		}
		exported = append(exported, BlogPost{
			ID:        p.Slug,
			Titulo:    p.Title,
			Autor:     p.Author,
			Fecha:     p.Date,
			Categoria: p.Category,
			Imagen:    ResolveMediaURL(mediaBase, p.CoverImage),
			Extracto:  p.Excerpt,
			Contenido: resolveContentMedia(mediaBase, BlocksToLegacyContent(p.Blocks)),
		})
	}
	return BlogResponse{Posts: exported}
}

func BuildBlogPost(p domain.BlogPost, mediaBase string) BlogPost {
	return BlogPost{
		ID:        p.Slug,
		Titulo:    p.Title,
		Autor:     p.Author,
		Fecha:     p.Date,
		Categoria: p.Category,
		Imagen:    ResolveMediaURL(mediaBase, p.CoverImage),
		Extracto:  p.Excerpt,
		Contenido: resolveContentMedia(mediaBase, BlocksToLegacyContent(p.Blocks)),
	}
}

func ResolveMediaURL(base, path string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	if strings.HasPrefix(path, "assets/") {
		return path
	}
	path = strings.TrimPrefix(path, "/")
	return strings.TrimSuffix(base, "/") + "/media/" + path
}

func resolveContentMedia(base, content string) string {
	if base == "" || content == "" {
		return content
	}
	// Rewrite [img:path|alt] and [pdf:path] for CMS-stored media paths
	content = regexp.MustCompile(`\[img:([^|\]]+)(?:\|[^\]]*)?\]`).ReplaceAllStringFunc(content, func(m string) string {
		sub := regexp.MustCompile(`\[img:([^|\]]+)`).FindStringSubmatch(m)
		if len(sub) < 2 {
			return m
		}
		return strings.Replace(m, sub[1], ResolveMediaURL(base, sub[1]), 1)
	})
	content = regexp.MustCompile(`\[pdf:([^\]]+)\]`).ReplaceAllStringFunc(content, func(m string) string {
		sub := regexp.MustCompile(`\[pdf:([^\]]+)\]`).FindStringSubmatch(m)
		if len(sub) < 2 {
			return m
		}
		return "[pdf:" + ResolveMediaURL(base, sub[1]) + "]"
	})
	return content
}

func BlocksToLegacyContent(blocks []domain.BlogBlock) string {
	var b strings.Builder
	for _, block := range blocks {
		switch block.Type {
		case "paragraph":
			var payload struct {
				Text string `json:"text"`
			}
			_ = json.Unmarshal(block.Content, &payload)
			if strings.TrimSpace(payload.Text) != "" {
				b.WriteString(payload.Text)
				b.WriteString("\n\n")
			}
		case "heading":
			var payload struct {
				Text  string `json:"text"`
				Level int    `json:"level"`
			}
			_ = json.Unmarshal(block.Content, &payload)
			if strings.TrimSpace(payload.Text) != "" {
				level := payload.Level
				if level < 1 || level > 3 {
					level = 2
				}
				b.WriteString(strings.Repeat("#", level))
				b.WriteString(" ")
				b.WriteString(payload.Text)
				b.WriteString("\n\n")
			}
		case "quote":
			var payload struct {
				Text string `json:"text"`
			}
			_ = json.Unmarshal(block.Content, &payload)
			if strings.TrimSpace(payload.Text) != "" {
				b.WriteString("> ")
				b.WriteString(payload.Text)
				b.WriteString("\n\n")
			}
		case "image":
			var payload struct {
				Src string `json:"src"`
				Alt string `json:"alt"`
			}
			_ = json.Unmarshal(block.Content, &payload)
			if payload.Src != "" {
				b.WriteString(fmt.Sprintf("[img:%s|%s]", payload.Src, payload.Alt))
				b.WriteString("\n\n")
			}
		case "pdf":
			var payload struct {
				Src string `json:"src"`
			}
			_ = json.Unmarshal(block.Content, &payload)
			if payload.Src != "" {
				b.WriteString(fmt.Sprintf("[pdf:%s]", payload.Src))
				b.WriteString("\n\n")
			}
		case "list":
			var payload struct {
				Items []string `json:"items"`
			}
			_ = json.Unmarshal(block.Content, &payload)
			for _, item := range payload.Items {
				b.WriteString("- ")
				b.WriteString(item)
				b.WriteString("\n")
			}
			b.WriteString("\n")
		}
	}
	return strings.TrimSpace(b.String())
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

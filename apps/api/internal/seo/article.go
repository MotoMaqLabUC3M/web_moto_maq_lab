package seo

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"html/template"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/external/publicformat"
)

//go:embed article.html
var articleTemplateSource string

var articleTmpl = template.Must(template.New("article").Parse(articleTemplateSource))

const defaultShareImage = "/assets/img/hero/blog.webp"

type ArticlePage struct {
	Lang             string
	OGLocale         string
	OGLocaleAlt      string
	Title            string
	Headline         string
	Description      string
	Canonical        string
	Image            string
	ImageAlt         string
	Author           string
	DatePublished    string
	DateModified     string
	Category         string
	Excerpt          string
	BodyParagraphs   []string
	AlternateES      string
	AlternateEN      string
	HreflangDefault  string
	JSONLD           template.HTML
	BreadcrumbJSONLD template.HTML
}

type ArticleInput struct {
	Origin     string
	Locale     string
	Post       domain.BlogPost
	MediaBase  string
	HasES      bool
	HasEN      bool
}

func RenderArticle(in ArticleInput) ([]byte, error) {
	page, err := NewArticlePage(in)
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	if err := articleTmpl.Execute(&buf, page); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func NewArticlePage(in ArticleInput) (ArticlePage, error) {
	origin := strings.TrimSuffix(in.Origin, "/")
	locale := in.Locale
	if locale != "en" {
		locale = "es"
	}
	exported := publicformat.BuildBlogPost(in.Post, in.MediaBase)

	headline := strings.TrimSpace(exported.Titulo)
	if headline == "" {
		headline = "MOTO-MAQLAB-UC3M"
	}
	title := headline + " | MOTO-MAQLAB-UC3M"
	desc := truncate(firstNonEmpty(exported.Extracto, headline), 155)
	canonical := origin + articlePath(locale, exported.ID)
	image := absolute(origin, firstNonEmpty(exported.Imagen, defaultShareImage))
	imageAlt := headline + " — MOTO-MAQLAB-UC3M"

	altES := ""
	altEN := ""
	if in.HasES {
		altES = origin + articlePath("es", exported.ID)
	}
	if in.HasEN {
		altEN = origin + articlePath("en", exported.ID)
	}
	hreflangDefault := canonical
	if altES != "" {
		hreflangDefault = altES
	}

	ogLocale := "es_ES"
	ogAlt := ""
	lang := "es"
	if locale == "en" {
		lang = "en"
		ogLocale = "en_US"
		if in.HasES {
			ogAlt = "es_ES"
		}
	} else if in.HasEN {
		ogAlt = "en_US"
	}

	datePublished := isoDate(exported.Fecha)
	dateModified := in.Post.UpdatedAt.UTC().Format(time.RFC3339)
	if in.Post.UpdatedAt.IsZero() {
		dateModified = datePublished
	}

	jsonLD, err := marshalJSONLD(map[string]any{
		"@context": "https://schema.org",
		"@type":    "NewsArticle",
		"headline": headline,
		"description": desc,
		"image":    []string{image},
		"datePublished": datePublished,
		"dateModified":  dateModified,
		"inLanguage":    lang,
		"articleSection": exported.Categoria,
		"author": map[string]any{
			"@type": "Person",
			"name":  firstNonEmpty(exported.Autor, "MOTO-MAQLAB-UC3M"),
		},
		"publisher": map[string]any{
			"@type": "Organization",
			"name":  "MOTO-MAQLAB-UC3M",
			"logo": map[string]any{
				"@type": "ImageObject",
				"url":   origin + "/assets/img/logos_uc3m/uc3m_logo_sin_fondo.webp",
			},
		},
		"mainEntityOfPage": map[string]any{
			"@type": "WebPage",
			"@id":   canonical,
		},
	})
	if err != nil {
		return ArticlePage{}, err
	}

	blogPath := origin + "/blog.html"
	blogName := "Blog"
	if locale == "en" {
		blogPath = origin + "/blog-en.html"
		blogName = "Blog"
	}
	crumbs, err := marshalJSONLD(map[string]any{
		"@context": "https://schema.org",
		"@type":    "BreadcrumbList",
		"itemListElement": []map[string]any{
			{"@type": "ListItem", "position": 1, "name": "MOTO-MAQLAB-UC3M", "item": origin + "/"},
			{"@type": "ListItem", "position": 2, "name": blogName, "item": blogPath},
			{"@type": "ListItem", "position": 3, "name": headline, "item": canonical},
		},
	})
	if err != nil {
		return ArticlePage{}, err
	}

	return ArticlePage{
		Lang:             lang,
		OGLocale:         ogLocale,
		OGLocaleAlt:      ogAlt,
		Title:            title,
		Headline:         headline,
		Description:      desc,
		Canonical:        canonical,
		Image:            image,
		ImageAlt:         imageAlt,
		Author:           exported.Autor,
		DatePublished:    datePublished,
		DateModified:     dateModified,
		Category:         exported.Categoria,
		Excerpt:          strings.TrimSpace(exported.Extracto),
		BodyParagraphs:   bodyParagraphs(exported.Contenido),
		AlternateES:      altES,
		AlternateEN:      altEN,
		HreflangDefault:  hreflangDefault,
		JSONLD:           jsonLD,
		BreadcrumbJSONLD: crumbs,
	}, nil
}

func marshalJSONLD(v any) (template.HTML, error) {
	raw, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	return template.HTML(raw), nil
}

func isoDate(value string) string {
	value = strings.TrimSpace(value)
	if len(value) >= 10 && value[4] == '-' && value[7] == '-' {
		return value[:10]
	}
	return value
}

func truncate(text string, max int) string {
	text = strings.Join(strings.Fields(text), " ")
	if text == "" || max <= 1 {
		return text
	}
	if utf8.RuneCountInString(text) <= max {
		return text
	}
	runes := []rune(text)
	cut := max - 1
	return strings.TrimSpace(string(runes[:cut])) + "…"
}

func bodyParagraphs(content string) []string {
	var out []string
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "[img:") || strings.HasPrefix(line, "[pdf:") {
			continue
		}
		line = strings.TrimLeft(line, "#> -")
		line = strings.TrimSpace(line)
		if line != "" {
			out = append(out, line)
		}
	}
	if len(out) > 12 {
		out = out[:12]
	}
	return out
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func IsNewsletter(category, content string) bool {
	if strings.EqualFold(strings.TrimSpace(category), "newsletter") {
		return true
	}
	return strings.Contains(content, "[pdf:") && strings.EqualFold(strings.TrimSpace(category), "newsletter")
}

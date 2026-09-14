package seo

import (
	"strings"
	"testing"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
)

func TestBuildSitemapIncludesStaticAndBlog(t *testing.T) {
	xml, err := BuildSitemap("https://motomaqlabuc3m.es", []BlogURL{
		{
			Slug:     "jornada-electronica",
			Locale:   "es",
			LastMod:  time.Date(2026, 6, 18, 0, 0, 0, 0, time.UTC),
			Image:    "assets/img/blog/cover.webp",
			ImageAlt: "Jornada electrónica",
			HasES:    true,
			HasEN:    true,
		},
		{
			Slug:    "newsletter-revista",
			Locale:  "es",
			Skip:    true,
			HasES:   true,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	out := string(xml)
	if !strings.Contains(out, `<?xml version="1.0"`) {
		t.Fatal("missing xml header")
	}
	if !strings.Contains(out, "https://motomaqlabuc3m.es/blog.html") {
		t.Fatal("missing blog page")
	}
	if !strings.Contains(out, "https://motomaqlabuc3m.es/media.html") {
		t.Fatal("missing media page")
	}
	if !strings.Contains(out, "https://motomaqlabuc3m.es/noticia-jornada-electronica.html") {
		t.Fatal("missing published article")
	}
	if !strings.Contains(out, `hreflang="en"`) {
		t.Fatal("missing hreflang")
	}
	if strings.Contains(out, "newsletter-revista") {
		t.Fatal("newsletter should be skipped")
	}
	if strings.Contains(out, "<loc>&") {
		t.Fatal("loc should not start with escaped ampersand")
	}
}

func TestBuildSitemapEscapesSpecialChars(t *testing.T) {
	xml, err := BuildSitemap("https://motomaqlabuc3m.es", []BlogURL{
		{
			Slug:     "a-and-b",
			Locale:   "es",
			Image:    "/assets/img/blog/cover.webp",
			ImageAlt: `Prueba <script> & "comillas"`,
			HasES:    true,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	out := string(xml)
	if strings.Contains(out, "<script>") {
		t.Fatal("image caption must be xml-escaped")
	}
	if !strings.Contains(out, "&lt;script&gt;") && !strings.Contains(out, "&#x3C;") {
		t.Fatal("expected escaped script tag in caption")
	}
}

func TestRenderArticleInjectsIndexableHead(t *testing.T) {
	html, err := RenderArticle(ArticleInput{
		Origin: "https://motomaqlabuc3m.es",
		Locale: "es",
		Post: domain.BlogPost{
			Slug:      "jornada-electronica",
			Title:     `Würth & Analog "Devices"`,
			Author:    "Nora Uribe",
			Date:      "2026-06-18",
			Category:  "Electrónica",
			Excerpt:   "Formación junto a Würth Elektronik.",
			Published: true,
			Locale:    "es",
		},
		HasES: true,
		HasEN: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	out := string(html)
	if !strings.Contains(out, `content="index, follow`) {
		t.Fatal("article HTML must be indexable")
	}
	if !strings.Contains(out, "https://motomaqlabuc3m.es/noticia-jornada-electronica.html") {
		t.Fatal("missing canonical")
	}
	if !strings.Contains(out, `hreflang="en"`) {
		t.Fatal("missing en hreflang")
	}
	if !strings.Contains(out, `"@type":"NewsArticle"`) {
		t.Fatal("missing NewsArticle json-ld")
	}
	if strings.Contains(out, `content="noindex`) {
		t.Fatal("must not noindex published articles")
	}
	if !strings.Contains(out, "Würth &amp; Analog") && !strings.Contains(out, "Würth") {
		t.Fatal("title should appear escaped or raw")
	}
}

func TestIsNewsletter(t *testing.T) {
	if !IsNewsletter("newsletter", "") {
		t.Fatal("expected newsletter skip")
	}
	if IsNewsletter("Noticias", "hola") {
		t.Fatal("regular post must not skip")
	}
}

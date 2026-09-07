package seo

import (
	"bytes"
	"encoding/xml"
	"strings"
	"time"
)

// BlogURL is a published article to include in the sitemap.
type BlogURL struct {
	Slug     string
	Locale   string
	LastMod  time.Time
	Image    string
	ImageAlt string
	HasES    bool
	HasEN    bool
	Skip     bool
}

// BuildSitemap returns a sitemap.xml that lists static pages plus published
// CMS articles. Newsletter posts are skipped (they are PDFs, not pages).
func BuildSitemap(origin string, posts []BlogURL) ([]byte, error) {
	origin = strings.TrimSuffix(origin, "/")

	var b bytes.Buffer
	b.WriteString(xml.Header)
	b.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`)
	b.WriteString(` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`)
	b.WriteString(` xmlns:xhtml="http://www.w3.org/1999/xhtml">` + "\n")

	for _, page := range StaticPages() {
		writeURL(&b, origin+page.Path, "", page.Changefreq, page.Priority,
			absolute(origin, page.Image), page.ImageAlt,
			hreflangPairs(origin, page.AlternateES, page.AlternateEN))
	}

	for _, post := range posts {
		if post.Skip || strings.TrimSpace(post.Slug) == "" {
			continue
		}
		path := articlePath(post.Locale, post.Slug)
		lastmod := ""
		if !post.LastMod.IsZero() {
			lastmod = post.LastMod.UTC().Format("2006-01-02")
		}
		writeURL(&b, origin+path, lastmod, "monthly", "0.6",
			absolute(origin, post.Image), post.ImageAlt,
			articleHreflangPairs(origin, post.Slug, post.HasES, post.HasEN))
	}

	b.WriteString("</urlset>\n")
	return b.Bytes(), nil
}

func writeURL(b *bytes.Buffer, loc, lastmod, changefreq, priority, image, imageAlt string, links [][2]string) {
	b.WriteString("  <url>\n    <loc>")
	writeEscaped(b, loc)
	b.WriteString("</loc>\n")
	if lastmod != "" {
		b.WriteString("    <lastmod>")
		writeEscaped(b, lastmod)
		b.WriteString("</lastmod>\n")
	}
	if changefreq != "" {
		b.WriteString("    <changefreq>")
		writeEscaped(b, changefreq)
		b.WriteString("</changefreq>\n")
	}
	if priority != "" {
		b.WriteString("    <priority>")
		writeEscaped(b, priority)
		b.WriteString("</priority>\n")
	}
	for _, link := range links {
		b.WriteString(`    <xhtml:link rel="alternate" hreflang="`)
		writeEscaped(b, link[0])
		b.WriteString(`" href="`)
		writeEscaped(b, link[1])
		b.WriteString("\"/>\n")
	}
	if image != "" {
		b.WriteString("    <image:image>\n      <image:loc>")
		writeEscaped(b, image)
		b.WriteString("</image:loc>\n")
		if imageAlt != "" {
			b.WriteString("      <image:caption>")
			writeEscaped(b, imageAlt)
			b.WriteString("</image:caption>\n")
		}
		b.WriteString("    </image:image>\n")
	}
	b.WriteString("  </url>\n")
}

func writeEscaped(b *bytes.Buffer, s string) {
	_ = xml.EscapeText(b, []byte(s))
}

func articlePath(locale, slug string) string {
	if locale == "en" {
		return "/news-" + slug + ".html"
	}
	return "/noticia-" + slug + ".html"
}

func articleHreflangPairs(origin, slug string, hasES, hasEN bool) [][2]string {
	es := origin + articlePath("es", slug)
	en := origin + articlePath("en", slug)
	var links [][2]string
	if hasES {
		links = append(links, [2]string{"es", es})
	}
	if hasEN {
		links = append(links, [2]string{"en", en})
	}
	if hasES {
		links = append(links, [2]string{"x-default", es})
	} else if hasEN {
		links = append(links, [2]string{"x-default", en})
	}
	return links
}

func hreflangPairs(origin, esPath, enPath string) [][2]string {
	var links [][2]string
	if esPath != "" {
		links = append(links, [2]string{"es", origin + esPath})
	}
	if enPath != "" {
		links = append(links, [2]string{"en", origin + enPath})
	}
	if esPath != "" {
		links = append(links, [2]string{"x-default", origin + esPath})
	} else if enPath != "" {
		links = append(links, [2]string{"x-default", origin + enPath})
	}
	return links
}

func absolute(origin, path string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return origin + path
}

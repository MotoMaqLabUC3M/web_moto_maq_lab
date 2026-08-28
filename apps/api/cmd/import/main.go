package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/config"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/domain"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
	"github.com/google/uuid"
)

type teamFile struct {
	Sections []struct {
		ID      string `json:"id"`
		Title   string `json:"title"`
		Members []struct {
			Name  string `json:"name"`
			Role  string `json:"role"`
			Image string `json:"image"`
		} `json:"members"`
	} `json:"sections"`
}

type blogFile struct {
	Posts []struct {
		ID        string `json:"id"`
		Titulo    string `json:"titulo"`
		Autor     string `json:"autor"`
		Fecha     string `json:"fecha"`
		Categoria string `json:"categoria"`
		Imagen    string `json:"imagen"`
		Extracto  string `json:"extracto"`
		Contenido string `json:"contenido"`
	} `json:"posts"`
}

func main() {
	siteRoot := flag.String("site", "../site", "path to apps/site")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	store, err := repository.NewStore(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer store.Close()

	teamRepo := repository.NewTeamRepository(store)
	blogRepo := repository.NewBlogRepository(store)
	ctx := context.Background()

	dataDir := filepath.Join(*siteRoot, "assets/data")

	if err := importTeam(ctx, teamRepo, filepath.Join(dataDir, "equipo.json"), filepath.Join(dataDir, "equipo-en.json")); err != nil {
		log.Fatalf("import team: %v", err)
	}
	if err := importBlog(ctx, blogRepo, filepath.Join(dataDir, "blog.json"), "es"); err != nil {
		log.Fatalf("import blog es: %v", err)
	}
	if err := importBlog(ctx, blogRepo, filepath.Join(dataDir, "blog-en.json"), "en"); err != nil {
		log.Fatalf("import blog en: %v", err)
	}

	log.Println("import completed")
}

func importTeam(ctx context.Context, repo *repository.TeamRepository, esPath, enPath string) error {
	es, err := readTeamFile(esPath)
	if err != nil {
		return err
	}
	en, _ := readTeamFile(enPath)
	enTitles := map[string]string{}
	enRoles := map[string]map[string]string{}
	for _, sec := range en.Sections {
		enTitles[sec.ID] = sec.Title
		enRoles[sec.ID] = map[string]string{}
		for _, m := range sec.Members {
			enRoles[sec.ID][m.Name] = m.Role
		}
	}

	now := time.Now().UTC()
	for i, sec := range es.Sections {
		titleEN := enTitles[sec.ID]
		dep := domain.Department{
			ID:        uuid.NewString(),
			Slug:      sec.ID,
			TitleES:   sec.Title,
			TitleEN:   titleEN,
			SortOrder: i,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := repo.CreateDepartment(ctx, dep); err != nil {
			return fmt.Errorf("department %s: %w", sec.ID, err)
		}
		for j, m := range sec.Members {
			roleEN := ""
			if roles, ok := enRoles[sec.ID]; ok {
				roleEN = roles[m.Name]
			}
			member := domain.TeamMember{
				ID:           uuid.NewString(),
				DepartmentID: dep.ID,
				Name:         m.Name,
				RoleES:       m.Role,
				RoleEN:       roleEN,
				ImagePath:    m.Image,
				SortOrder:    j,
				CreatedAt:    now,
				UpdatedAt:    now,
			}
			if err := repo.CreateMember(ctx, member); err != nil {
				return fmt.Errorf("member %s: %w", m.Name, err)
			}
		}
	}
	log.Printf("imported %d departments from %s", len(es.Sections), esPath)
	return nil
}

func readTeamFile(path string) (teamFile, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return teamFile{}, err
	}
	var data teamFile
	return data, json.Unmarshal(raw, &data)
}

func importBlog(ctx context.Context, repo *repository.BlogRepository, path, locale string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("skip missing %s", path)
			return nil
		}
		return err
	}
	var data blogFile
	if err := json.Unmarshal(raw, &data); err != nil {
		return err
	}
	now := time.Now().UTC()
	for _, p := range data.Posts {
		post := domain.BlogPost{
			ID:         uuid.NewString(),
			Slug:       p.ID,
			Title:      p.Titulo,
			Author:     p.Autor,
			Date:       p.Fecha,
			Category:   p.Categoria,
			CoverImage: p.Imagen,
			Excerpt:    p.Extracto,
			Blocks:     legacyToBlocks(p.Contenido),
			Locale:     locale,
			Published:  true,
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		if err := repo.CreatePost(ctx, post); err != nil {
			return fmt.Errorf("post %s: %w", p.ID, err)
		}
	}
	log.Printf("imported %d posts from %s (%s)", len(data.Posts), path, locale)
	return nil
}

func legacyToBlocks(content string) []domain.BlogBlock {
	if strings.TrimSpace(content) == "" {
		return nil
	}
	var blocks []domain.BlogBlock
	paragraph := strings.Builder{}

	flushParagraph := func() {
		text := strings.TrimSpace(paragraph.String())
		if text == "" {
			return
		}
		blocks = append(blocks, domain.BlogBlock{
			ID:   uuid.NewString(),
			Type: "paragraph",
			Content: mustJSON(map[string]string{
				"text": text,
			}),
		})
		paragraph.Reset()
	}

	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			flushParagraph()
			continue
		}
		if strings.HasPrefix(line, "## ") {
			flushParagraph()
			blocks = append(blocks, domain.BlogBlock{
				ID:   uuid.NewString(),
				Type: "heading",
				Content: mustJSON(map[string]string{
					"text": strings.TrimPrefix(line, "## "),
				}),
			})
			continue
		}
		if strings.HasPrefix(line, "[img:") {
			flushParagraph()
			match := strings.TrimSuffix(strings.TrimPrefix(line, "[img:"), "]")
			parts := strings.SplitN(match, "|", 2)
			src := parts[0]
			alt := ""
			if len(parts) > 1 {
				alt = parts[1]
			}
			blocks = append(blocks, domain.BlogBlock{
				ID:   uuid.NewString(),
				Type: "image",
				Content: mustJSON(map[string]string{
					"src": src,
					"alt": alt,
				}),
			})
			continue
		}
		if strings.HasPrefix(line, "[pdf:") {
			flushParagraph()
			src := strings.TrimSuffix(strings.TrimPrefix(line, "[pdf:"), "]")
			blocks = append(blocks, domain.BlogBlock{
				ID:   uuid.NewString(),
				Type: "pdf",
				Content: mustJSON(map[string]string{
					"src": src,
				}),
			})
			continue
		}
		if paragraph.Len() > 0 {
			paragraph.WriteString("\n\n")
		}
		paragraph.WriteString(line)
	}
	flushParagraph()
	return blocks
}

func mustJSON(v any) json.RawMessage {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return b
}

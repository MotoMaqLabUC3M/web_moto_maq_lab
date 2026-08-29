package router

import (
	"net/http"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/config"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/handler"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/middleware"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/service"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Dependencies struct {
	Config  config.Config
	Auth    *service.AuthService
	Team    *service.TeamService
	Blog    *service.BlogService
	Public  *service.PublicService
}

func New(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   deps.Config.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	health := handler.NewHealthHandler()
	authHandler := handler.NewAuthHandler(deps.Auth)
	teamHandler := handler.NewTeamHandler(deps.Team)
	blogHandler := handler.NewBlogHandler(deps.Blog)
	publicHandler := handler.NewPublicHandler(deps.Public)
	mediaHandler := handler.NewMediaHandler(deps.Config.UploadDir)
	authMW := middleware.NewAuthMiddleware(deps.Auth)

	r.Get("/health", health.Health)
	r.Get("/api/v1/health", health.Health)
	r.Get("/media/*", mediaHandler.Serve)

	r.Route("/api/v1", func(api chi.Router) {
		api.Post("/auth/login", authHandler.Login)

		api.Route("/public", func(pub chi.Router) {
			pub.Get("/team", publicHandler.Team)
			pub.Get("/blog", publicHandler.Blog)
			pub.Get("/blog/{slug}", publicHandler.BlogPost)
		})

		api.Group(func(protected chi.Router) {
			protected.Use(authMW.RequireAuth)

			protected.Get("/auth/me", authHandler.Me)
			protected.Get("/stats", publicHandler.Stats)

			protected.Route("/departments", func(dr chi.Router) {
				dr.Get("/", teamHandler.ListDepartments)
				dr.Post("/", teamHandler.CreateDepartment)
				dr.Put("/reorder", teamHandler.ReorderDepartments)
				dr.Put("/{id}", teamHandler.UpdateDepartment)
				dr.Delete("/{id}", teamHandler.DeleteDepartment)
				dr.Post("/{id}/members", teamHandler.CreateMember)
				dr.Put("/{id}/members/reorder", teamHandler.ReorderMembers)
			})

			protected.Route("/members", func(mr chi.Router) {
				mr.Put("/{id}", teamHandler.UpdateMember)
				mr.Delete("/{id}", teamHandler.DeleteMember)
				mr.Post("/{id}/photo", teamHandler.UploadMemberPhoto)
				mr.Delete("/{id}/photo", teamHandler.RemoveMemberPhoto)
			})

			protected.Route("/blog/sections", func(sr chi.Router) {
				sr.Get("/", blogHandler.ListSections)
				sr.Post("/", blogHandler.CreateSection)
				sr.Put("/reorder", blogHandler.ReorderSections)
				sr.Get("/{id}", blogHandler.GetSection)
				sr.Put("/{id}", blogHandler.UpdateSection)
				sr.Delete("/{id}", blogHandler.DeleteSection)
				sr.Put("/{id}/posts/reorder", blogHandler.ReorderPosts)
			})

			protected.Route("/blog/posts", func(br chi.Router) {
				br.Get("/", blogHandler.ListPosts)
				br.Get("/lookup", blogHandler.LookupPost)
				br.Post("/", blogHandler.CreatePost)
				br.Get("/{id}", blogHandler.GetPost)
				br.Put("/{id}", blogHandler.UpdatePost)
				br.Delete("/{id}", blogHandler.DeletePost)
				br.Post("/{id}/cover", blogHandler.UploadCover)
			})

			protected.Post("/media/upload", blogHandler.UploadMedia)
		})
	})

	return r
}

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/config"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/external/storage"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/repository"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/router"
	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("upload dir: %v", err)
	}

	store, err := repository.NewStore(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer store.Close()

	userRepo := repository.NewUserRepository(store)
	teamRepo := repository.NewTeamRepository(store)
	blogRepo := repository.NewBlogRepository(store)

	storageSvc := storage.NewStorageService(cfg.UploadDir, cfg.MaxUploadMB)

	authSvc := service.NewAuthService(userRepo, cfg)
	teamSvc := service.NewTeamService(teamRepo, storageSvc)
	blogSvc := service.NewBlogService(blogRepo, storageSvc)
	publicSvc := service.NewPublicService(teamSvc, blogRepo, cfg.PublicAPIBaseURL)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := authSvc.EnsureAdmin(ctx); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	handler := router.New(router.Dependencies{
		Config: cfg,
		Auth:   authSvc,
		Team:   teamSvc,
		Blog:   blogSvc,
		Public: publicSvc,
	})

	server := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("api listening on %s (env=%s db=%s)", cfg.HTTPAddr, cfg.Env, cfg.DBDriver)
		log.Printf("public API base: %s", cfg.PublicAPIBaseURL)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

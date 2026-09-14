package storage

import (
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/MotoMaqLabUC3M/web_moto_maq_lab/apps/api/internal/config"
)

type StorageService struct {
	backend    Backend
	maxBytes   int64
	allowedExt map[string]bool
	local      *LocalBackend
}

func NewFromConfig(cfg config.Config) (*StorageService, error) {
	var backend Backend
	var local *LocalBackend

	switch cfg.StorageDriver {
	case "r2":
		r2, err := NewR2Backend(R2Config{
			AccountID:       cfg.R2AccountID,
			AccessKeyID:     cfg.R2AccessKeyID,
			SecretAccessKey: cfg.R2SecretAccessKey,
			Bucket:          cfg.R2BucketName,
		})
		if err != nil {
			return nil, err
		}
		backend = r2
	default:
		local = NewLocalBackend(cfg.UploadDir)
		backend = local
	}

	return &StorageService{
		backend:    backend,
		local:      local,
		maxBytes:   cfg.MaxUploadMB * 1024 * 1024,
		allowedExt: defaultAllowedExt(),
	}, nil
}

func defaultAllowedExt() map[string]bool {
	return map[string]bool{
		".webp": true,
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".pdf":  true,
	}
}

func (s *StorageService) Save(relativePath string, r io.Reader, size int64) (string, error) {
	if size > s.maxBytes {
		return "", fmt.Errorf("file exceeds max upload size (%d MB)", s.maxBytes/(1024*1024))
	}

	ext := strings.ToLower(filepath.Ext(relativePath))
	if !s.allowedExt[ext] {
		return "", fmt.Errorf("file type not allowed: %s", ext)
	}

	path, err := s.backend.Save(relativePath, r, size)
	if err != nil {
		return "", err
	}
	if size > 0 {
		// Size is validated upstream by handlers; backends may not enforce it.
		_ = size
	}
	return path, nil
}

func (s *StorageService) Delete(relativePath string) error {
	if strings.HasPrefix(relativePath, "http://") || strings.HasPrefix(relativePath, "https://") {
		return nil
	}
	return s.backend.Delete(relativePath)
}

func (s *StorageService) Absolute(relativePath string) string {
	if s.local == nil {
		return ""
	}
	return s.local.Absolute(relativePath)
}

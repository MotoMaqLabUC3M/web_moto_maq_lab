package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type StorageService struct {
	root       string
	maxBytes   int64
	allowedExt map[string]bool
}

func NewStorageService(root string, maxUploadMB int64) *StorageService {
	return &StorageService{
		root:     root,
		maxBytes: maxUploadMB * 1024 * 1024,
		allowedExt: map[string]bool{
			".webp": true,
			".jpg":  true,
			".jpeg": true,
			".png":  true,
			".pdf":  true,
		},
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

	clean := filepath.Clean(relativePath)
	if strings.HasPrefix(clean, "..") {
		return "", fmt.Errorf("invalid path")
	}

	full := filepath.Join(s.root, filepath.FromSlash(clean))
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", fmt.Errorf("mkdir: %w", err)
	}

	f, err := os.Create(full)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer f.Close()

	written, err := io.Copy(f, r)
	if err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}
	if size > 0 && written > size {
		return "", fmt.Errorf("upload size mismatch")
	}

	return filepath.ToSlash(clean), nil
}

func (s *StorageService) Delete(relativePath string) error {
	if relativePath == "" {
		return nil
	}
	clean := filepath.Clean(relativePath)
	if strings.HasPrefix(clean, "..") {
		return fmt.Errorf("invalid path")
	}
	full := filepath.Join(s.root, filepath.FromSlash(clean))
	if err := os.Remove(full); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *StorageService) Absolute(relativePath string) string {
	return filepath.Join(s.root, filepath.FromSlash(relativePath))
}

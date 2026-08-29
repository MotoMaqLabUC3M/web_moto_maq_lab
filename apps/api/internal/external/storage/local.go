package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type LocalBackend struct {
	root string
}

func NewLocalBackend(root string) *LocalBackend {
	return &LocalBackend{root: root}
}

func (b *LocalBackend) Save(relativePath string, r io.Reader, _ int64) (string, error) {
	clean := filepath.Clean(relativePath)
	if strings.HasPrefix(clean, "..") {
		return "", fmt.Errorf("invalid path")
	}

	full := filepath.Join(b.root, filepath.FromSlash(clean))
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", fmt.Errorf("mkdir: %w", err)
	}

	f, err := os.Create(full)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer f.Close()

	if _, err := io.Copy(f, r); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return filepath.ToSlash(clean), nil
}

func (b *LocalBackend) Delete(relativePath string) error {
	if relativePath == "" {
		return nil
	}
	clean := filepath.Clean(relativePath)
	if strings.HasPrefix(clean, "..") {
		return fmt.Errorf("invalid path")
	}
	full := filepath.Join(b.root, filepath.FromSlash(clean))
	if err := os.Remove(full); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (b *LocalBackend) Absolute(relativePath string) string {
	return filepath.Join(b.root, filepath.FromSlash(relativePath))
}

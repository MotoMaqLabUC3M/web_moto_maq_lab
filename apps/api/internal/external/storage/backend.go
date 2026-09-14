package storage

import "io"

// Backend persists uploaded files (local disk or Cloudflare R2).
type Backend interface {
	Save(relativePath string, r io.Reader, size int64) (string, error)
	Delete(relativePath string) error
}

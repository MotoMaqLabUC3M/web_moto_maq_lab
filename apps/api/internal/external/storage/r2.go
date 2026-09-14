package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type R2Backend struct {
	client *s3.Client
	bucket string
}

type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
}

func NewR2Backend(cfg R2Config) (*R2Backend, error) {
	if cfg.AccountID == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" || cfg.Bucket == "" {
		return nil, fmt.Errorf("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME are required")
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	client := s3.New(s3.Options{
		Region: "auto",
		BaseEndpoint: aws.String(endpoint),
		Credentials: credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		),
		UsePathStyle: true,
	})

	return &R2Backend{client: client, bucket: cfg.Bucket}, nil
}

func (b *R2Backend) Save(relativePath string, r io.Reader, size int64) (string, error) {
	key := normalizeObjectKey(relativePath)
	if key == "" {
		return "", fmt.Errorf("invalid path")
	}

	_, err := b.client.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      aws.String(b.bucket),
		Key:         aws.String(key),
		Body:        r,
		ContentType: aws.String(contentTypeForExt(filepath.Ext(key))),
		ContentLength: func() *int64 {
			if size > 0 {
				return aws.Int64(size)
			}
			return nil
		}(),
	})
	if err != nil {
		return "", fmt.Errorf("r2 upload: %w", err)
	}

	return key, nil
}

func (b *R2Backend) Delete(relativePath string) error {
	if relativePath == "" {
		return nil
	}
	key := normalizeObjectKey(relativePath)
	if key == "" {
		return fmt.Errorf("invalid path")
	}

	_, err := b.client.DeleteObject(context.Background(), &s3.DeleteObjectInput{
		Bucket: aws.String(b.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("r2 delete: %w", err)
	}
	return nil
}

func normalizeObjectKey(relativePath string) string {
	clean := filepath.ToSlash(filepath.Clean(relativePath))
	clean = strings.TrimPrefix(clean, "/")
	if clean == "" || strings.Contains(clean, "..") {
		return ""
	}
	return clean
}

func contentTypeForExt(ext string) string {
	switch strings.ToLower(ext) {
	case ".webp":
		return "image/webp"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".pdf":
		return "application/pdf"
	default:
		return "application/octet-stream"
	}
}

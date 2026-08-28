// Gateway de desarrollo: web estática + /admin + /api en :3000
package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	root := os.Getenv("MML_SITE_ROOT")
	if root == "" {
		wd, _ := os.Getwd()
		root = filepath.Join(wd, "apps", "site")
	}

	apiTarget := envOr("MML_API_URL", "http://127.0.0.1:8080")
	adminTarget := envOr("MML_ADMIN_URL", "http://127.0.0.1:3001")
	listen := envOr("MML_GATEWAY_ADDR", ":3000")

	apiURL, err := url.Parse(apiTarget)
	if err != nil {
		log.Fatal(err)
	}
	adminURL, err := url.Parse(adminTarget)
	if err != nil {
		log.Fatal(err)
	}

	apiProxy := httputil.NewSingleHostReverseProxy(apiURL)
	adminProxy := httputil.NewSingleHostReverseProxy(adminURL)

	mux := http.NewServeMux()

	mux.HandleFunc("/admin", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/admin" || r.URL.Path == "/admin/" {
			http.Redirect(w, r, "/admin/login", http.StatusFound)
			return
		}
		adminProxy.ServeHTTP(w, r)
	})
	mux.Handle("/admin/", adminProxy)
	mux.Handle("/api/", apiProxy)
	mux.Handle("/media/", apiProxy)
	mux.Handle("/health", apiProxy)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		serveStatic(w, r, root)
	})

	log.Printf("Gateway dev → web %s | admin %s | api %s", root, adminTarget, apiTarget)
	log.Printf("Abre http://localhost%s", listen)
	log.Fatal(http.ListenAndServe(listen, mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func serveStatic(w http.ResponseWriter, r *http.Request, root string) {
	reqPath := r.URL.Path
	if reqPath == "/" {
		reqPath = "/index.html"
	}

	candidates := []string{reqPath}
	if strings.HasSuffix(reqPath, "/") {
		candidates = append([]string{reqPath + "index.html"}, candidates...)
	} else {
		candidates = append(candidates, reqPath+".html", reqPath+"/index.html")
	}

	for _, candidate := range candidates {
		clean := filepath.Clean(candidate)
		if strings.Contains(clean, "..") {
			continue
		}
		full := filepath.Join(root, clean)
		info, err := os.Stat(full)
		if err != nil || info.IsDir() {
			continue
		}
		http.ServeFile(w, r, full)
		return
	}

	http.NotFound(w, r)
}

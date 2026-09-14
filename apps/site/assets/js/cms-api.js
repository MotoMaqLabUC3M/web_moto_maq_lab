/**
 * cms-api.js — Carga datos del CMS (API SaaS) con fallback a JSON estático.
 *
 * Configuración (prioridad):
 *   1. window.__MML_API_BASE__  (ej. "https://motomaqlabuc3m.es")
 *   2. <meta name="mml-api-base" content="...">
 *   3. Mismo origen (sitio y API en el mismo dominio vía nginx)
 */
(function () {
    function apiBase() {
        if (typeof window.__MML_API_BASE__ === 'string' && window.__MML_API_BASE__) {
            return window.__MML_API_BASE__.replace(/\/$/, '');
        }
        var meta = document.querySelector('meta[name="mml-api-base"]');
        if (meta && meta.content && meta.content.trim()) {
            return meta.content.trim().replace(/\/$/, '');
        }
        if (window.location.protocol.startsWith('http')) {
            return window.location.origin.replace(/\/$/, '');
        }
        return '';
    }

    async function fetchJSON(url) {
        var res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    async function loadTeam(locale) {
        locale = locale || 'es';
        var base = apiBase();
        if (base) {
            try {
                return await fetchJSON(base + '/api/v1/public/team?locale=' + encodeURIComponent(locale));
            } catch (err) {
                console.warn('[cms-api] team API failed, using JSON fallback', err);
            }
        }
        var jsonFile = locale === 'en' ? 'assets/data/equipo-en.json' : 'assets/data/equipo.json';
        return fetchJSON(jsonFile);
    }

    async function loadBlog(locale) {
        locale = locale || 'es';
        var base = apiBase();
        if (base) {
            try {
                return await fetchJSON(base + '/api/v1/public/blog?locale=' + encodeURIComponent(locale));
            } catch (err) {
                console.warn('[cms-api] blog API failed, using JSON fallback', err);
            }
        }
        var jsonFile = locale === 'en' ? 'assets/data/blog-en.json' : 'assets/data/blog.json';
        return fetchJSON(jsonFile);
    }

    async function loadBlogPost(slug, locale) {
        locale = locale || 'es';
        var base = apiBase();
        if (base) {
            try {
                var res = await fetch(
                    base + '/api/v1/public/blog/' + encodeURIComponent(slug) + '?locale=' + encodeURIComponent(locale)
                );
                if (res.status === 404) return null;
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            } catch (err) {
                console.warn('[cms-api] blog post API failed, using JSON fallback', err);
            }
        }
        var jsonFile = locale === 'en' ? 'assets/data/blog-en.json' : 'assets/data/blog.json';
        var data = await fetchJSON(jsonFile);
        if (!data.posts) return null;
        return data.posts.find(function (p) { return p.id === slug; }) || null;
    }

    window.motoMaqLabCms = {
        apiBase: apiBase,
        loadTeam: loadTeam,
        loadBlog: loadBlog,
        loadBlogPost: loadBlogPost,
    };
})();

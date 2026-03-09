/**
 * blogDetalle.js
 * Renderiza página de detalle de noticia del blog.
 * Soporta imágenes inline con sintaxis: [img:ruta|alt text]
 */
(function () {
    const JSON_PATH = 'assets/data/blog.json';

    async function init() {
        const container = document.getElementById('noticia-detalle');
        if (!container) return;

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) { renderError(container); return; }

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();
            const post = data.posts.find(function (p) { return p.id === id; });

            if (!post) { renderError(container); return; }

            document.title = post.titulo + ' | MotoMaqLab UC3M';
            render(container, post);
        } catch (err) {
            console.error('Error cargando noticia:', err);
            renderError(container);
        }
    }

    function render(container, post) {
        // Formatear fecha
        var fecha = new Date(post.fecha);
        var opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        var fechaStr = fecha.toLocaleDateString('es-ES', opciones);

        // Hero con imagen de fondo
        var heroStyle = post.imagen
            ? "background-image: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 55%, var(--c-dark) 100%), url('" + post.imagen + "'); background-size: cover; background-position: center;"
            : 'background: linear-gradient(180deg, #1a1a1a 0%, var(--c-dark) 100%);';

        // Parsear contenido
        var contentHTML = parseContenido(post.contenido);

        container.innerHTML =
            '<!-- HERO -->' +
            '<section class="ev-hero" style="' + heroStyle + '">' +
                '<div class="ev-hero-content">' +
                    '<a href="blog.html" class="sp-back">← Blog</a>' +
                    '<span class="badge">' + post.categoria + '</span>' +
                    '<h1>' + post.titulo + '</h1>' +
                    '<p class="ev-hero-desc">' + post.extracto + '</p>' +
                '</div>' +
            '</section>' +

            '<!-- INFO BAR -->' +
            '<section class="ev-info-bar">' +
                '<div class="ev-info-card">' +
                    '<span class="ev-info-icon">✍️</span>' +
                    '<div><span class="ev-info-label">Autor</span><span class="ev-info-value">' + post.autor + '</span></div>' +
                '</div>' +
                '<div class="ev-info-card">' +
                    '<span class="ev-info-icon">📅</span>' +
                    '<div><span class="ev-info-label">Fecha</span><span class="ev-info-value">' + fechaStr + '</span></div>' +
                '</div>' +
                '<div class="ev-info-card">' +
                    '<span class="ev-info-icon">📂</span>' +
                    '<div><span class="ev-info-label">Categoría</span><span class="ev-info-value">' + post.categoria + '</span></div>' +
                '</div>' +
            '</section>' +

            '<!-- CONTENT -->' +
            '<article class="blog-article">' +
                contentHTML +
            '</article>' +

            '<!-- CTA -->' +
            '<section class="sp-cta-section">' +
                '<a href="blog.html" class="btn btn--primary">← Ver todas las noticias</a>' +
            '</section>';
    }

    /**
     * Parsea contenido del blog.
     * - ## Titulo = h2 con label decorativo
     * - [img:ruta|alt] = imagen inline
     * - Texto normal = párrafos
     */
    function parseContenido(text) {
        if (!text) return '';

        var lines = text.split('\n');
        var html = '';
        var inSection = false;

        lines.forEach(function (line) {
            line = line.trim();
            if (!line) return;

            if (line.startsWith('## ')) {
                // Cerrar sección anterior si existe
                if (inSection) {
                    html += '</section>';
                }
                html += '<section class="sp-text-block">';
                html += '<div class="sp-section-label"><div class="sp-label-line"></div><h2>' + line.slice(3) + '</h2></div>';
                inSection = true;
            } else if (line.startsWith('[img:')) {
                // Imagen inline: [img:ruta|alt text]
                var match = line.match(/^\[img:([^|]+)\|?([^\]]*)\]$/);
                if (match) {
                    var src = match[1];
                    var alt = match[2] || '';
                    html += '<figure class="blog-inline-img">';
                    html += '<img src="' + src + '" alt="' + alt + '" loading="lazy" />';
                    if (alt) {
                        html += '<figcaption>' + alt + '</figcaption>';
                    }
                    html += '</figure>';
                }
            } else {
                // Párrafo normal
                if (!inSection) {
                    html += '<section class="sp-text-block">';
                    inSection = true;
                }
                html += '<div class="sp-text-content"><p>' + line + '</p></div>';
            }
        });

        if (inSection) {
            html += '</section>';
        }

        return html;
    }

    function renderError(container) {
        container.innerHTML =
            '<div class="sp-error">' +
                '<span class="sp-error-icon">🔍</span>' +
                '<h2>Noticia no encontrada</h2>' +
                '<p>El artículo que buscas no existe o ha sido eliminado.</p>' +
                '<a href="blog.html" class="btn btn--primary">Ver blog</a>' +
            '</div>';
    }

    document.addEventListener('DOMContentLoaded', init);
})();

/**
 * blogDetalle.js
 * Renderiza página de detalle de noticia del blog.
 * Soporta imágenes inline con sintaxis: [img:ruta|alt text]
 * Soporta visor PDF con sintaxis: [pdf:ruta]
 */
(function () {
    const JSON_PATH = 'assets/data/blog.json';
    const EQUIPO_PATH = 'assets/data/equipo.json';

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

            // Cargar datos del equipo
            let equipoData = [];
            try {
                const resEq = await fetch(EQUIPO_PATH);
                const eqJson = await resEq.json();
                equipoData = eqJson.sections.flatMap(sec => sec.members);
            } catch (err) {
                console.warn('Error cargando equipo.json', err);
            }

            document.title = post.titulo + ' | MotoMaqLab UC3M';
            render(container, post, equipoData);
        } catch (err) {
            console.error('Error cargando noticia:', err);
            renderError(container);
        }
    }

    function render(container, post, equipoData) {
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

        // Autor panel
        var authorHTML = '';
        if (post.autor && equipoData && equipoData.length > 0) {
            var authorMatches = equipoData.filter(m => m.name.toLowerCase().includes(post.autor.toLowerCase()));
            var matchingAuthor = authorMatches.length > 0 ? authorMatches[0] : null;
            
            if (matchingAuthor) {
                var imgSrc = matchingAuthor.image && matchingAuthor.image !== "" ? matchingAuthor.image : "assets/img/logos_uc3m/uc3m_logo_sin_fondo.png";
                authorHTML = `
                    <div class="blog-author-box">
                        <img src="${imgSrc}" alt="${matchingAuthor.name}" class="author-avatar" loading="lazy">
                        <div class="author-details">
                            <h4>${matchingAuthor.name}</h4>
                            <span>${matchingAuthor.role}</span>
                        </div>
                    </div>
                `;
            }
        }

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
                    '<span class="ev-info-icon"><i data-lucide="pen-tool"></i></span>' +
                    '<div><span class="ev-info-label">Autor</span><span class="ev-info-value">' + post.autor + '</span></div>' +
                '</div>' +
                '<div class="ev-info-card">' +
                    '<span class="ev-info-icon"><i data-lucide="calendar"></i></span>' +
                    '<div><span class="ev-info-label">Fecha</span><span class="ev-info-value">' + fechaStr + '</span></div>' +
                '</div>' +
                '<div class="ev-info-card">' +
                    '<span class="ev-info-icon"><i data-lucide="folder"></i></span>' +
                    '<div><span class="ev-info-label">Categoría</span><span class="ev-info-value">' + post.categoria + '</span></div>' +
                '</div>' +
            '</section>' +

            '<!-- CONTENT -->' +
            '<article class="blog-article">' +
                contentHTML +
                authorHTML +
            '</article>' +

            '<!-- CTA -->' +
            '<section class="sp-cta-section">' +
                '<a href="blog.html" class="btn btn--primary">← Ver todas las noticias</a>' +
            '</section>';
        
        if (window.lucide) { lucide.createIcons(); }
    }

    /**
     * Parsea contenido del blog.
     * - ## Titulo = h2 con label decorativo
     * - [img:ruta|alt] = imagen inline
     * - [pdf:ruta] = iframe de PDF inline
     * - [texto](url) = link markdown
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
                var matchImg = line.match(/^\[img:([^|]+)\|?([^\]]*)\]$/);
                if (matchImg) {
                    var src = matchImg[1];
                    var alt = matchImg[2] || '';
                    html += '<figure class="blog-inline-img">';
                    html += '<img src="' + src + '" alt="' + alt + '" loading="lazy" />';
                    if (alt) {
                        html += '<figcaption>' + alt + '</figcaption>';
                    }
                    html += '</figure>';
                }
            } else if (line.startsWith('[pdf:')) {
                // PDF render: [pdf:ruta]
                var matchPdf = line.match(/^\[pdf:([^\]]+)\]$/);
                if (matchPdf) {
                    var pdfUrl = matchPdf[1];
                    if (!inSection) {
                        html += '<section class="sp-text-block">';
                        inSection = true;
                    }
                    html += '<div class="pdf-viewer-container" style="margin: 2rem 0; text-align:center;">';
                    html += '<iframe src="' + pdfUrl + '" width="100%" height="700px" style="border:none; border-radius:12px; background:#fff;"></iframe>';
                    html += '<div style="margin-top:1rem;"><a href="' + pdfUrl + '" target="_blank" class="btn btn--primary" style="display:inline-block; font-size:0.9rem;">Abrir PDF en otra pestaña</a></div>';
                    html += '</div>';
                }
            } else {
                // Parse standard links inside text
                var parsedLine = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--c-red); text-decoration:underline;">$1</a>');
                
                // Párrafo normal
                if (!inSection) {
                    html += '<section class="sp-text-block">';
                    inSection = true;
                }
                html += '<div class="sp-text-content"><p>' + parsedLine + '</p></div>';
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
                '<span class="sp-error-icon"><i data-lucide="search-x" style="width: 48px; height: 48px;"></i></span>' +
                '<h2>Noticia no encontrada</h2>' +
                '<p>El artículo que buscas no existe o ha sido eliminado.</p>' +
                '<a href="blog.html" class="btn btn--primary">Ver blog</a>' +
            '</div>';
        if (window.lucide) { lucide.createIcons(); }
    }

    document.addEventListener('DOMContentLoaded', init);
})();

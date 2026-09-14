/**
 * blogDetalle.js
 * Renderiza página de detalle de noticia del blog.
 * Soporta imágenes inline con sintaxis: [img:ruta|alt text]
 * Soporta visor PDF con sintaxis: [pdf:ruta]
 */
(function () {
    const lang = document.documentElement.lang || 'es';
    const isEnglish = lang === 'en';

    async function init() {
        const container = document.getElementById('noticia-detalle');
        if (!container) return;

        const id = window.motoMaqLabDetailIdFromUrl
            ? window.motoMaqLabDetailIdFromUrl('noticia')
            : new URLSearchParams(window.location.search).get('id');

        if (!id) { renderError(container); return; }

        try {
            const post = await window.motoMaqLabCms.loadBlogPost(id, lang);

            if (!post) { renderError(container); return; }

            // Newsletters with embedded PDFs don't have a dedicated detail page;
            // the blog listing opens the PDF directly in a new tab.
            // If someone lands here (e.g. via search engine), redirect to the PDF.
            var pdfMatch = post.contenido ? post.contenido.match(/\[pdf:([^\]]+)\]/) : null;
            if (post.categoria && post.categoria.toLowerCase() === 'newsletter' && pdfMatch) {
                window.location.replace(pdfMatch[1]);
                return;
            }

            // Cargar datos del equipo
            let equipoData = [];
            try {
                const eqJson = await window.motoMaqLabCms.loadTeam(lang);
                equipoData = eqJson.sections.flatMap(sec => sec.members);
            } catch (err) {
                console.warn('Error cargando equipo', err);
            }

            if (typeof motoMaqLabApplySeo === 'function') {
                motoMaqLabApplySeo({
                    title: post.titulo + ' | MOTO-MAQLAB-UC3M',
                    description: post.extracto || '',
                    canonicalPath: (isEnglish ? '/news-' : '/noticia-') + post.id + '.html',
                    imagePath: post.imagen || 'assets/img/hero/blog.webp',
                    imageAlt: post.titulo + ' — MOTO-MAQLAB-UC3M',
                    ogType: 'article',
                    ogLocale: isEnglish ? 'en_US' : 'es_ES',
                    author: post.autor || '',
                    publishedTime: post.fecha || '',
                    hreflang: {
                        es: '/noticia-' + post.id + '.html',
                        en: '/news-' + post.id + '.html',
                        default: '/noticia-' + post.id + '.html'
                    },
                    indexable: true
                });
            } else {
                document.title = post.titulo + ' | MOTO-MAQLAB-UC3M';
            }
            injectStructuredData(post);
            render(container, post, equipoData);
        } catch (err) {
            console.error('Error cargando noticia:', err);
            renderError(container);
        }
    }

    function heroBgStyle(imagen) {
        if (!imagen) return '';
        var safeUrl = String(imagen).replace(/'/g, '%27');
        if (!safeUrl.startsWith('/') && !safeUrl.startsWith('http')) {
            safeUrl = '/' + safeUrl;
        }
        return ' style="--ev-hero-bg:url(\'' + safeUrl + '\')"';
    }

    function render(container, post, equipoData) {
        // Formatear fecha
        var fecha = new Date(post.fecha);
        var opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        var fechaStr = fecha.toLocaleDateString('es-ES', opciones);

        // Hero con imagen de fondo (gradiente en CSS; solo la URL va en variable)
        var heroCls = post.imagen ? 'ev-hero ev-hero--photo' : 'ev-hero ev-hero--no-photo';
        var heroStyleAttr = heroBgStyle(post.imagen);

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
                            <span class="author-written-by">${isEnglish ? 'Written by' : 'Escrito por'}</span>
                            <h4>${matchingAuthor.name}</h4>
                            <span class="author-role">${matchingAuthor.role}</span>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML =
            '<!-- HERO -->' +
            '<section class="' + heroCls + '"' + heroStyleAttr + '>' +
                '<div class="ev-hero-content">' +
                    '<a href="' + (isEnglish ? 'blog-en.html' : 'blog.html') + '" class="sp-back">← Blog</a>' +
                    '<span class="badge">' + post.categoria + '</span>' +
                    '<h1>' + post.titulo + '</h1>' +
                    '<p class="ev-hero-desc">' + post.extracto + '</p>' +
                '</div>' +
            '</section>' +

            '<!-- META -->' +
            '<section class="blog-meta-bar" aria-label="Metadatos del artículo">' +
                '<div class="blog-meta-bar__inner">' +
                    '<div class="blog-meta-item">' +
                        '<i data-lucide="pen-tool" class="blog-meta-icon"></i>' +
                        '<div><span class="blog-meta-label">' + (isEnglish ? 'Author' : 'Autor') + '</span><span class="blog-meta-value">' + post.autor + '</span></div>' +
                    '</div>' +
                    '<span class="blog-meta-sep" aria-hidden="true"></span>' +
                    '<div class="blog-meta-item">' +
                        '<i data-lucide="calendar" class="blog-meta-icon"></i>' +
                        '<div><span class="blog-meta-label">' + (isEnglish ? 'Date' : 'Fecha') + '</span><span class="blog-meta-value">' + fechaStr + '</span></div>' +
                    '</div>' +
                    '<span class="blog-meta-sep" aria-hidden="true"></span>' +
                    '<div class="blog-meta-item">' +
                        '<i data-lucide="folder" class="blog-meta-icon"></i>' +
                        '<div><span class="blog-meta-label">' + (isEnglish ? 'Category' : 'Categoría') + '</span><span class="blog-meta-value">' + post.categoria + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</section>' +

            '<!-- CONTENT -->' +
            '<article class="blog-article">' +
                contentHTML +
                authorHTML +
            '</article>' +

            '<!-- CTA -->' +
            '<section class="sp-cta-section">' +
                '<a href="' + (isEnglish ? 'blog-en.html' : 'blog.html') + '" class="btn btn--primary">← ' + (isEnglish ? 'View all news' : 'Ver todas las noticias') + '</a>' +
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
    function parseInlineMarkdown(text) {
        if (!text) return '';
        var safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return safe
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/~~(.+?)~~/g, '<s>$1</s>')
            .replace(/`([^`]+)`/g, '<code class="blog-inline-code">$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="blog-inline-a">$1</a>');
    }

    function parseContenido(text) {
        if (!text) return '';

        var lines = text.split('\n');
        var html = '';
        var inSection = false;

        lines.forEach(function (line) {
            line = line.trim();
            if (!line) return;

            if (/^#{1,3}\s/.test(line)) {
                if (inSection) {
                    html += '</section>';
                }
                var level = line.match(/^#+/)[0].length;
                var title = line.replace(/^#+\s*/, '');
                var tag = level === 1 ? 'h1' : (level === 2 ? 'h2' : 'h3');
                html += '<section class="sp-text-block">';
                html += '<div class="sp-section-label"><div class="sp-label-line"></div><' + tag + '>' + parseInlineMarkdown(title) + '</' + tag + '></div>';
                inSection = true;
            } else if (line.startsWith('> ')) {
                if (!inSection) {
                    html += '<section class="sp-text-block">';
                    inSection = true;
                }
                html += '<blockquote class="blog-blockquote"><p>' + parseInlineMarkdown(line.slice(2)) + '</p></blockquote>';
            } else if (line.startsWith('[img:')) {
                // Imagen inline: [img:ruta|alt text]
                var matchImg = line.match(/^\[img:([^|]+)\|?([^\]]*)\]$/);
                if (matchImg) {
                    var src = matchImg[1];
                    var alt = (matchImg[2] || '').trim();
                    if (!alt) {
                        alt = 'Ilustración del artículo — MOTO-MAQLAB-UC3M';
                    }
                    alt = alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
                    html += '<figure class="blog-inline-img">';
                    html += '<img src="' + encodeURI(src) + '" alt="' + alt + '" loading="lazy" />';
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
                    html += '<div class="pdf-viewer-block">';
                    html += '<iframe src="' + encodeURI(pdfUrl) + '" class="pdf-viewer-frame" title="Documento PDF embebido"></iframe>';
                    html += '<div class="pdf-viewer-actions"><a href="' + encodeURI(pdfUrl) + '" target="_blank" class="btn btn--primary pdf-viewer-open-tab">' + (isEnglish ? 'Open PDF in new tab' : 'Abrir PDF en otra pestaña') + '</a></div>';
                    html += '</div>';
                }
            } else {
                var parsedLine = parseInlineMarkdown(line);

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
                '<span class="sp-error-icon"><i data-lucide="search-x"></i></span>' +
                '<h2>' + (isEnglish ? 'News not found' : 'Noticia no encontrada') + '</h2>' +
                '<p>' + (isEnglish ? 'The article you are looking for does not exist or has been removed.' : 'El artículo que buscas no existe o ha sido eliminado.') + '</p>' +
                '<a href="' + (isEnglish ? 'blog-en.html' : 'blog.html') + '" class="btn btn--primary">' + (isEnglish ? 'View blog' : 'Ver blog') + '</a>' +
            '</div>';
        if (window.lucide) { lucide.createIcons(); }
    }

    function pageOrigin() {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            return window.location.origin;
        }
        return 'https://motomaqlabuc3m.es';
    }

    function absoluteMedia(path, fallback) {
        var origin = pageOrigin();
        if (!path) return origin + fallback;
        if (String(path).indexOf('http') === 0) return path;
        return origin + '/' + String(path).replace(/^\//, '');
    }

    function injectStructuredData(post) {
        var origin = pageOrigin();
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        var data = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": post.titulo,
            "description": post.extracto || "",
            "image": absoluteMedia(post.imagen, '/assets/img/hero/blog.webp'),
            "datePublished": post.fecha,
            "inLanguage": isEnglish ? "en" : "es",
            "articleSection": post.categoria || "",
            "author": {
                "@type": "Person",
                "name": post.autor || "MOTO-MAQLAB-UC3M"
            },
            "publisher": {
                "@type": "Organization",
                "name": "MOTO-MAQLAB-UC3M",
                "logo": {
                    "@type": "ImageObject",
                    "url": origin + "/assets/img/logos_uc3m/uc3m_logo_sin_fondo.webp"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": origin + "/" + (isEnglish ? "news-" : "noticia-") + post.id + ".html"
            }
        };
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
    }

    document.addEventListener('DOMContentLoaded', init);
})();

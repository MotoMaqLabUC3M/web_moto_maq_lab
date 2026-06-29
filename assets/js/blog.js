/**
 * blog.js
 * Carga posts desde JSON y los muestra ordenados del más reciente al más antiguo.
 * Cada tarjeta enlaza a noticia-<id>.html (URL limpia; ?id= sigue funcionando en noticia.html)
 * También renderiza preview en index.html (2 últimas noticias).
 */
(function () {

    const lang = document.documentElement.lang || 'es';
    const isEnglish = lang === 'en';
    const JSON_PATH = isEnglish ? 'assets/data/blog-en.json' : 'assets/data/blog.json';

    function sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function init() {
        const blogContainer = document.getElementById('blog-container');
        const indexContainer = document.getElementById('blog-index-container');

        if (!blogContainer && !indexContainer) return;

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();

            if (!data.posts || !data.posts.length) {
                if (blogContainer) {
                    const empty = document.getElementById('blog-empty');
                    if (empty) empty.style.display = 'block';
                }
                return;
            }

            // Ordenar del más reciente al más antiguo
            const posts = data.posts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            // Página de blog: todos los posts
            if (blogContainer) {
                renderPosts(blogContainer, posts);
            }

            // Index: solo los 2 más recientes
            if (indexContainer) {
                renderPosts(indexContainer, posts.slice(0, 2));
            }

        } catch (err) {
            console.error('Error cargando blog:', err);
        }
    }

    function renderPosts(container, posts) {
        const fragment = document.createDocumentFragment();

        posts.forEach(function (post) {
            var link = document.createElement('a');
            
            // Check if it's a Newsletter or contains a PDF tag
            var isPdfDirect = false;
            var pdfUrl = '';
            var matchPdf = post.contenido ? post.contenido.match(/\[pdf:([^\]]+)\]/) : null;
            
            if (post.categoria && post.categoria.toLowerCase() === 'newsletter' && matchPdf) {
                isPdfDirect = true;
                pdfUrl = matchPdf[1];
            }

            if (isPdfDirect) {
                link.href = pdfUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else {
                link.href = (isEnglish ? 'news-' : 'noticia-') + post.id + '.html';
            }
            
            link.className = 'blog-card-link';

            var card = document.createElement('div');
            card.className = 'blog-card';

            // Formatear fecha
            var fecha = new Date(post.fecha);
            var opciones = { month: 'short', day: 'numeric' };
            var locale = isEnglish ? 'en-US' : 'es-ES';
            var fechaStr = fecha.toLocaleDateString(locale, opciones);

            // Imagen de portada (safe, no inline onerror)
            var imgHTML = post.imagen
                ? '<div class="blog-card-img"><img src="' + sanitize(post.imagen) + '" alt="' + sanitize(post.titulo) + '" loading="lazy" /></div>'
                : '';

            var fallbackHTML = '<div class="blog-card-img"><div class="newsletter-fallback"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><br>' + (isEnglish ? 'MotoMaqLab Magazine' : 'Revista MotoMaqLab') + '</div></div>';

            // Truncar extracto (aumentado para que no corte frases tan pronto)
            var extracto = post.extracto || '';
            if (extracto.length > 250) {
                extracto = extracto.substring(0, 250) + '[...]';
            }

            if (isPdfDirect) {
                card.classList.add('newsletter-only-cover');
                card.innerHTML = imgHTML || fallbackHTML;
            } else {
                const byText = isEnglish ? 'by ' : 'por ';
                const onText = isEnglish ? ' on ' : ' el ';
                const readMoreText = isEnglish ? 'Read more →' : 'Leer más →';
                
                card.innerHTML =
                    imgHTML +
                    '<div class="blog-card-body">' +
                        '<span class="blog-card-categoria">' + sanitize(post.categoria) + '</span>' +
                        '<h3>' + sanitize(post.titulo) + '</h3>' +
                        '<p class="blog-card-meta">' + (isEnglish ? 'by ' : 'por ') + sanitize(post.autor) + (isEnglish ? ' on ' : ' el ') + sanitize(fechaStr) + '</p>' +
                        '<p class="blog-card-extracto">' + sanitize(extracto) + '</p>' +
                        '<span class="blog-card-leer">' + (isEnglish ? 'Read more →' : 'Leer más →') + '</span>' +
                    '</div>';
            }

            // Safe image error handling (no inline onerror)
            var img = card.querySelector('img');
            if (img) {
                img.addEventListener('error', function () {
                    this.style.display = 'none';
                    this.parentElement.innerHTML = '<div class="newsletter-fallback"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><br>' + (isEnglish ? 'Image not found' : 'Imagen no encontrada') + '</div>';
                });
            }

            link.appendChild(card);
            fragment.appendChild(link);
        });

        container.appendChild(fragment);
    }

    document.addEventListener('DOMContentLoaded', init);
})();

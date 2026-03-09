/**
 * blog.js
 * Carga posts desde JSON y los muestra ordenados del más reciente al más antiguo.
 * Cada tarjeta enlaza a noticia.html?id=xxx
 * También renderiza preview en index.html (2 últimas noticias).
 */
(function () {
    const JSON_PATH = 'assets/data/blog.json';

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
            link.href = 'noticia.html?id=' + encodeURIComponent(post.id);
            link.className = 'blog-card-link';

            var card = document.createElement('div');
            card.className = 'blog-card';

            // Formatear fecha
            var fecha = new Date(post.fecha);
            var opciones = { month: 'short', day: 'numeric' };
            var fechaStr = fecha.toLocaleDateString('es-ES', opciones);

            // Imagen de portada
            var imgHTML = post.imagen
                ? '<div class="blog-card-img"><img src="' + post.imagen + '" alt="' + post.titulo + '" loading="lazy" /></div>'
                : '';

            // Truncar extracto
            var extracto = post.extracto || '';
            if (extracto.length > 120) {
                extracto = extracto.substring(0, 120) + '[...]';
            }

            card.innerHTML =
                imgHTML +
                '<div class="blog-card-body">' +
                    '<span class="blog-card-categoria">' + post.categoria + '</span>' +
                    '<h3>' + post.titulo + '</h3>' +
                    '<p class="blog-card-meta">by ' + post.autor + ' on ' + fechaStr + '</p>' +
                    '<p class="blog-card-extracto">' + extracto + '</p>' +
                    '<span class="blog-card-leer">Read more →</span>' +
                '</div>';

            link.appendChild(card);
            fragment.appendChild(link);
        });

        container.appendChild(fragment);
    }

    document.addEventListener('DOMContentLoaded', init);
})();

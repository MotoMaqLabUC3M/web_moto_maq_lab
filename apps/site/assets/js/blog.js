/**
 * blog.js
 * Carga posts desde la API (por secciones) o JSON estático.
 * Cada tarjeta enlaza a noticia-<id>.html / news-<id>.html
 * También renderiza preview en index.html (3 últimas noticias).
 */
(function () {

    const lang = document.documentElement.lang || 'es';
    const isEnglish = lang === 'en';

    function sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function isNewsletterPost(post, layout) {
        if (layout === 'newsletter') return true;
        var matchPdf = post.contenido ? post.contenido.match(/\[pdf:([^\]]+)\]/) : null;
        return post.categoria && post.categoria.toLowerCase() === 'newsletter' && matchPdf;
    }

    async function init() {
        const sectionsRoot = document.getElementById('blog-sections');
        const blogContainer = document.getElementById('blog-container');
        const newsletterContainer = document.getElementById('newsletter-container');
        const indexContainer = document.getElementById('blog-index-container');

        if (!sectionsRoot && !blogContainer && !indexContainer && !newsletterContainer) return;

        try {
            const data = await window.motoMaqLabCms.loadBlog(lang);

            if (sectionsRoot) {
                renderSections(sectionsRoot, data);
            } else if (blogContainer || newsletterContainer) {
                renderLegacyContainers(data, blogContainer, newsletterContainer);
            }

            if (indexContainer && data.posts && data.posts.length) {
                const posts = data.posts.slice().sort(function (a, b) {
                    return new Date(b.fecha) - new Date(a.fecha);
                });
                renderPosts(indexContainer, posts.slice(0, 3), 'grid');
            }

        } catch (err) {
            console.error('Error cargando blog:', err);
        }
    }

    function renderSections(root, data) {
        root.innerHTML = '';

        if (data.sections && data.sections.length) {
            data.sections.forEach(function (section) {
                if (!section.posts || !section.posts.length) return;

                const sectionEl = document.createElement('section');
                sectionEl.className = 'section-container';
                sectionEl.id = 'blog-section-' + section.id;

                const titleWrap = document.createElement('div');
                titleWrap.className = 'section-title';
                titleWrap.innerHTML =
                    '<h2>' + sanitize(section.title) + '</h2>' +
                    (section.subtitle ? '<p>' + sanitize(section.subtitle) + '</p>' : '');

                const grid = document.createElement('div');
                grid.className = 'blog-grid';

                renderPosts(grid, section.posts, section.layout || 'grid');

                sectionEl.appendChild(titleWrap);
                sectionEl.appendChild(grid);
                root.appendChild(sectionEl);
            });
            return;
        }

        if (!data.posts || !data.posts.length) {
            const empty = document.createElement('p');
            empty.className = 'blog-empty';
            empty.textContent = isEnglish
                ? 'No articles published yet.'
                : 'No hay artículos publicados todavía.';
            root.appendChild(empty);
            return;
        }

        renderLegacyIntoRoot(root, data.posts);
    }

    function renderLegacyIntoRoot(root, posts) {
        const sorted = posts.slice().sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        const normalPosts = [];
        const newsletterPosts = [];

        sorted.forEach(function (post) {
            if (isNewsletterPost(post, 'newsletter')) {
                newsletterPosts.push(post);
            } else {
                normalPosts.push(post);
            }
        });

        if (normalPosts.length) {
            root.appendChild(buildLegacySection(
                isEnglish ? 'Recent News' : 'Noticias Recientes',
                isEnglish ? 'The latest from MOTO-MAQLAB-UC3M' : 'Lo último de MOTO-MAQLAB-UC3M',
                normalPosts,
                'grid'
            ));
        }

        if (newsletterPosts.length) {
            root.appendChild(buildLegacySection(
                'Newsletters',
                isEnglish ? 'MOTO-MAQLAB-UC3M Magazine' : 'Revista MOTO-MAQLAB-UC3M',
                newsletterPosts,
                'newsletter'
            ));
        }
    }

    function buildLegacySection(title, subtitle, posts, layout) {
        const sectionEl = document.createElement('section');
        sectionEl.className = 'section-container';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'section-title';
        titleWrap.innerHTML =
            '<h2>' + sanitize(title) + '</h2>' +
            '<p>' + sanitize(subtitle) + '</p>';

        const grid = document.createElement('div');
        grid.className = 'blog-grid';
        renderPosts(grid, posts, layout);

        sectionEl.appendChild(titleWrap);
        sectionEl.appendChild(grid);
        return sectionEl;
    }

    function renderLegacyContainers(data, blogContainer, newsletterContainer) {
        if (!data.posts || !data.posts.length) {
            if (blogContainer) {
                const empty = document.getElementById('blog-empty');
                if (empty) empty.style.display = 'block';
            }
            if (newsletterContainer) {
                const nEmpty = document.getElementById('newsletter-empty');
                if (nEmpty) nEmpty.style.display = 'block';
            }
            return;
        }

        const posts = data.posts.slice().sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        const normalPosts = [];
        const newsletterPosts = [];

        posts.forEach(function (post) {
            if (isNewsletterPost(post, 'newsletter')) {
                newsletterPosts.push(post);
            } else {
                normalPosts.push(post);
            }
        });

        if (blogContainer) {
            if (normalPosts.length > 0) {
                renderPosts(blogContainer, normalPosts, 'grid');
            } else {
                const empty = document.getElementById('blog-empty');
                if (empty) empty.style.display = 'block';
            }
        }

        if (newsletterContainer) {
            if (newsletterPosts.length > 0) {
                renderPosts(newsletterContainer, newsletterPosts, 'newsletter');
            } else {
                const nEmpty = document.getElementById('newsletter-empty');
                if (nEmpty) nEmpty.style.display = 'block';
            }
        }
    }

    function renderPosts(container, posts, layout) {
        const fragment = document.createDocumentFragment();

        posts.forEach(function (post) {
            var link = document.createElement('a');

            var isPdfDirect = false;
            var pdfUrl = '';
            var matchPdf = post.contenido ? post.contenido.match(/\[pdf:([^\]]+)\]/) : null;

            if (isNewsletterPost(post, layout) && matchPdf) {
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

            var fecha = new Date(post.fecha);
            var opciones = { month: 'short', day: 'numeric' };
            var locale = isEnglish ? 'en-US' : 'es-ES';
            var fechaStr = fecha.toLocaleDateString(locale, opciones);

            var imgHTML = post.imagen
                ? '<div class="blog-card-img"><img src="' + sanitize(post.imagen) + '" alt="' + sanitize(post.titulo) + '" loading="lazy" /></div>'
                : '';

            var fallbackHTML = '<div class="blog-card-img"><div class="newsletter-fallback"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><br>' + (isEnglish ? 'MOTO-MAQLAB-UC3M Magazine' : 'Revista MOTO-MAQLAB-UC3M') + '</div></div>';

            var extracto = post.extracto || '';
            if (extracto.length > 250) {
                extracto = extracto.substring(0, 250) + '[...]';
            }

            if (isPdfDirect) {
                card.classList.add('newsletter-only-cover');
                card.innerHTML = imgHTML || fallbackHTML;
            } else {
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

    async function loadIgFeed() {
        const igGrid = document.getElementById('ig-grid');
        if (!igGrid) return;
        try {
            const res = await fetch('assets/data/ig_feed.json');
            if (!res.ok) throw new Error('No IG data');
            const data = await res.json();

            if (!data.posts || data.posts.length === 0) {
                igGrid.innerHTML = '<p style="text-align:center;width:100%;grid-column:1/-1;">No hay posts de Instagram disponibles en este momento.</p>';
                return;
            }

            igGrid.innerHTML = '';
            data.posts.forEach(post => {
                const isVideo = post.type === 'GraphVideo';
                const icon = isVideo ? '<div class="media-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>' : '<div class="media-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div>';

                const captionText = post.caption ? post.caption.substring(0, 80) + '...' : 'Instagram Post';

                igGrid.innerHTML += ` 
                    <a href="${post.url}" target="_blank" rel="noopener noreferrer" class="ig-card stagger-reveal">
                        <img src="${post.image}" alt="Post de Instagram de MOTO-MAQLAB-UC3M" loading="lazy">
                        ${icon}
                        <div class="ig-overlay">
                            <p>${captionText}</p>
                        </div>
                    </a>
                `;
            });
        } catch (error) {
            console.error('Error loading IG feed:', error);
            igGrid.innerHTML = '<p style="text-align:center;width:100%;grid-column:1/-1;">No se pudo cargar el feed de Instagram.</p>';
        }
    }

    loadIgFeed();

})();

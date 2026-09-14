/**
 * Actualiza <title>, meta description, canonical y Open Graph / Twitter
 * para páginas con contenido cargado dinámicamente.
 */
(function () {
    var ORIGIN = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
        ? window.location.origin
        : 'https://motomaqlabuc3m.es';

    function truncate(text, max) {
        max = max || 155;
        if (!text) return '';
        var t = String(text).replace(/\s+/g, ' ').trim();
        if (t.length <= max) return t;
        return t.slice(0, max - 1).trim() + '\u2026';
    }

    function absoluteUrl(path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        var p = path.replace(/^\.\//, '');
        if (p.charAt(0) !== '/') p = '/' + p;
        return ORIGIN + p;
    }

    function escapeSelectorAttr(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function upsertMeta(attrName, key, content) {
        var sel = 'meta[' + attrName + '="' + escapeSelectorAttr(key) + '"]';
        var el = document.head.querySelector(sel);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attrName, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    function setCanonical(href) {
        var el = document.head.querySelector('link[rel="canonical"]');
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', 'canonical');
            document.head.appendChild(el);
        }
        el.setAttribute('href', href);
    }

    function setHreflang(hreflang) {
        if (!hreflang) return;
        document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (el) {
            el.parentNode.removeChild(el);
        });
        ['es', 'en', 'default'].forEach(function (key) {
            var path = hreflang[key];
            if (!path) return;
            var link = document.createElement('link');
            link.setAttribute('rel', 'alternate');
            link.setAttribute('hreflang', key === 'default' ? 'x-default' : key);
            link.setAttribute('href', absoluteUrl(path));
            document.head.appendChild(link);
        });
    }

    /**
     * @param {object} opts
     * @param {string} opts.title
     * @param {string} [opts.description]
     * @param {string} opts.canonicalPath
     * @param {string} [opts.imagePath]
     * @param {string} [opts.imageAlt]
     * @param {string} [opts.ogType]
     * @param {string} [opts.ogLocale]
     * @param {string} [opts.author]
     * @param {string} [opts.publishedTime]
     * @param {object} [opts.hreflang]
     * @param {boolean} [opts.indexable]
     */
    window.motoMaqLabApplySeo = function (opts) {
        if (!opts || !opts.title || !opts.canonicalPath) return;

        var desc = truncate(opts.description || '', 155);
        var canonical = opts.canonicalPath.indexOf('http') === 0 ? opts.canonicalPath : ORIGIN + opts.canonicalPath;
        var image = opts.imagePath ? absoluteUrl(opts.imagePath) : ORIGIN + '/assets/img/hero/index.webp';
        var ogType = opts.ogType || 'website';
        var imageAlt = opts.imageAlt || opts.title;

        document.title = opts.title;
        upsertMeta('name', 'description', desc || opts.title);
        setCanonical(canonical);

        if (opts.indexable !== false) {
            upsertMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }

        upsertMeta('property', 'og:title', opts.title);
        upsertMeta('property', 'og:description', desc || opts.title);
        upsertMeta('property', 'og:url', canonical);
        upsertMeta('property', 'og:image', image);
        upsertMeta('property', 'og:image:alt', imageAlt);
        upsertMeta('property', 'og:type', ogType);
        if (opts.ogLocale) {
            upsertMeta('property', 'og:locale', opts.ogLocale);
        }

        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', opts.title);
        upsertMeta('name', 'twitter:description', desc || opts.title);
        upsertMeta('name', 'twitter:image', image);
        upsertMeta('name', 'twitter:image:alt', imageAlt);

        if (opts.author) {
            upsertMeta('name', 'author', opts.author);
            upsertMeta('property', 'article:author', opts.author);
        }
        if (opts.publishedTime) {
            upsertMeta('property', 'article:published_time', opts.publishedTime);
        }

        setHreflang(opts.hreflang);
    };
})();

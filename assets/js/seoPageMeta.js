/**
 * Actualiza <title>, meta description, canonical y Open Graph / Twitter
 * para páginas con contenido cargado por query (?id=).
 */
(function () {
    var ORIGIN = 'https://motomaqlabuc3m.es';

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

    /**
     * @param {object} opts
     * @param {string} opts.title - document.title
     * @param {string} [opts.description] - texto plano, se trunca
     * @param {string} opts.canonicalPath - p.ej. /evento.html?id=abc (sin origin)
     * @param {string} [opts.imagePath] - ruta relativa o absoluta a imagen destacada
     * @param {string} [opts.ogType] - og:type (article | website)
     */
    window.motoMaqLabApplySeo = function (opts) {
        if (!opts || !opts.title || !opts.canonicalPath) return;

        var desc = truncate(opts.description || '', 155);
        var canonical = opts.canonicalPath.indexOf('http') === 0 ? opts.canonicalPath : ORIGIN + opts.canonicalPath;
        var image = opts.imagePath ? absoluteUrl(opts.imagePath) : ORIGIN + '/assets/img/hero/index.webp';
        var ogType = opts.ogType || 'website';

        document.title = opts.title;
        upsertMeta('name', 'description', desc || opts.title);
        setCanonical(canonical);

        upsertMeta('property', 'og:title', opts.title);
        upsertMeta('property', 'og:description', desc || opts.title);
        upsertMeta('property', 'og:url', canonical);
        upsertMeta('property', 'og:image', image);
        upsertMeta('property', 'og:type', ogType);

        upsertMeta('name', 'twitter:title', opts.title);
        upsertMeta('name', 'twitter:description', desc || opts.title);
        upsertMeta('name', 'twitter:image', image);
    };
})();

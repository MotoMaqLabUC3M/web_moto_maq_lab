/**
 * Resuelve el id de detalle (evento / noticia / patrocinador) desde
 * __MML_ROUTE_ID__, ?id= o nombre de archivo evento-*.html, etc.
 */
(function () {
    window.motoMaqLabDetailIdFromUrl = function (kind) {
        if (typeof window.__MML_ROUTE_ID__ === 'string' && window.__MML_ROUTE_ID__.length) {
            return window.__MML_ROUTE_ID__;
        }
        var q = new URLSearchParams(window.location.search);
        var fromQuery = q.get('id');
        if (fromQuery) return fromQuery;

        var path = window.location.pathname || '';
        var re =
            kind === 'evento'
                ? /evento-([^./]+)\.html/i
                : kind === 'noticia'
                  ? /noticia-([^./]+)\.html/i
                  : /(?:patrocinador|sponsor)-([^./]+)\.html/i;
        var m = path.match(re);
        if (!m) return null;
        try {
            var id = decodeURIComponent(m[1]);
            return id.replace(/-en$/i, '');
        } catch (e) {
            return m[1].replace(/-en$/i, '');
        }
    };
})();

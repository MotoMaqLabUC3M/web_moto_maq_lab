/**
 * Traducción Google: el widget NO se carga al inicio (menos JS en auditorías).
 * El usuario abre el traductor desde el pie (botón "Idioma / Translate").
 */
(function () {
    // La traducción automática vía cookie 'googtrans' ha sido eliminada
    // porque ahora redirigimos nativamente a las páginas en inglés (layout.js).
    // El script de Google Translate solo se cargará a petición manual del usuario.
})();

function googleTranslateElementInit() {
    if (!window.google || !google.translate) return;
    new google.translate.TranslateElement(
        {
            pageLanguage: 'es',
            autoDisplay: false
        },
        'google_translate_element'
    );
}

/**
 * Carga el script externo de Google Translate una sola vez (bajo demanda).
 */
window.motoMaqLabLoadGoogleTranslate = function () {
    var holder = document.getElementById('google_translate_element');
    if (holder) {
        holder.classList.remove('d-none');
        holder.style.display = '';
        holder.style.removeProperty('display');
    }
    if (window.google && window.google.translate) {
        googleTranslateElementInit();
        return;
    }
    if (document.querySelector('script[data-mml-gtranslate]')) return;

    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.dataset.mmlGtranslate = '1';
    document.body.appendChild(s);
};

// Detectar el idioma del navegador y aplicar traducción automáticamente si no es español
(function () {
    try {
        var userLang = navigator.language || navigator.userLanguage;
        var isSpanish = userLang.toLowerCase().startsWith('es');

        // Si el usuario no tiene español como idioma principal y no ha establecido una cookie previa
        if (!isSpanish && !document.cookie.includes('googtrans')) {
            var targetLang = userLang.split('-')[0]; // Ejemplo: 'en', 'fr', 'de'

            // Establecemos la cookie para que Google Translate traduzca automáticamente al cargar
            document.cookie = "googtrans=/es/" + targetLang + "; path=/; Secure; SameSite=Lax";
            document.cookie = "googtrans=/es/" + targetLang + "; domain=." + document.domain + "; path=/; Secure; SameSite=Lax";
        }
    } catch (e) {
        console.error("Error al configurar la traducción automática:", e);
    }
})();

function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'es',
        autoDisplay: false
    }, 'google_translate_element');
}

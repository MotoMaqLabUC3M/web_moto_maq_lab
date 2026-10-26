/**
 * forSponsors.js
 * Lógica para la página "Para Patrocinadores" / "For Sponsors"
 * Incluye: animación de números (estadísticas), form handling, y selección de tier.
 */
document.addEventListener('DOMContentLoaded', () => {
    initStatsCounters();
    initTierSelection();
    initFormHandling();
});

/**
 * Anima los números de las estadísticas cuando entran en la pantalla
 */
function initStatsCounters() {
    const statsRow = document.getElementById('fs-stats-row');
    if (!statsRow) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        // Los números ya están pre-renderizados en el HTML accesible, respetamos no animar
        return;
    }

    const stats = statsRow.querySelectorAll('.fs-stat');
    let hasAnimated = false;

    const animateCounters = () => {
        if (hasAnimated) return;
        hasAnimated = true;

        stats.forEach(stat => {
            const targetStr = stat.getAttribute('data-target');
            const target = parseInt(targetStr, 10);
            const suffix = stat.getAttribute('data-suffix') || '';
            const numberEl = stat.querySelector('.fs-stat__number');
            if (!numberEl || isNaN(target)) return;

            // Comenzar en 0 solo si se va a animar
            numberEl.textContent = '0' + suffix;

            const duration = 2000; // ms
            const frameRate = 30;
            const totalFrames = Math.round((duration / 1000) * frameRate);
            let frame = 0;

            const updateCounter = () => {
                frame++;
                const progress = frame / totalFrames;
                // Easing out cube
                const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));

                const isEn = document.documentElement.lang === 'en';
                const formatted = target >= 1000 ? currentCount.toLocaleString(isEn ? 'en-US' : 'es-ES') : currentCount;
                numberEl.textContent = formatted + suffix;

                if (frame < totalFrames) {
                    requestAnimationFrame(updateCounter);
                } else {
                    const isEn = document.documentElement.lang === 'en';
                    const formatted = target >= 1000 ? target.toLocaleString(isEn ? 'en-US' : 'es-ES') : target;
                    numberEl.textContent = formatted + suffix;
                }
            };

            requestAnimationFrame(updateCounter);
        });
    };

    // Usar IntersectionObserver para detonar la animación
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        }, { threshold: 0.5 });

        observer.observe(statsRow);
    } else {
        // Fallback
        animateCounters();
    }
}

/**
 * Al hacer click en "Contactar" en una tarjeta de tier,
 * pre-selecciona esa opción en el formulario.
 */
function initTierSelection() {
    const tierCards = document.querySelectorAll('.fs-tier-card');
    const formSelect = document.getElementById('rango');

    if (!formSelect) return;

    tierCards.forEach(card => {
        const btn = card.querySelector('.fs-tier-card__cta');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            const tierValue = card.getAttribute('data-tier');
            if (tierValue) {
                // El value en el select puede diferir un poco, intentar encajar
                const option = Array.from(formSelect.options).find(opt => 
                    opt.value.toLowerCase().includes(tierValue.toLowerCase())
                );
                
                if (option) {
                    formSelect.value = option.value;
                    // Opcional: efecto visual de selección
                    formSelect.style.borderColor = 'var(--c-red)';
                    setTimeout(() => formSelect.style.borderColor = '', 1000);
                }
            }
        });
    });
}

/**
 * Maneja el envío del formulario usando Fetch API
 * Incluye defensas de ciberseguridad (Anti-CRLF, Rate Limiting, Anti-Spam Honeypot, Allowlist)
 */
function initFormHandling() {
    const form = document.getElementById('sponsor-contact-form');
    const successMsg = document.getElementById('form-success');
    const errorMsg = document.getElementById('form-error');
    const retryBtn = document.getElementById('form-error-retry');
    const submitBtn = document.getElementById('form-submit-btn');

    if (!form || !successMsg || !submitBtn) return;

    // Registro de tiempo de inicialización para detección de bots no humanos (<800ms)
    const formInitTime = Date.now();
    const COOLDOWN_MS = 15000; // 15 segundos entre envíos sucesivos
    const LAST_SUBMIT_KEY = 'fs_last_submit_ts';

    if (retryBtn && errorMsg) {
        retryBtn.addEventListener('click', () => {
            errorMsg.setAttribute('hidden', '');
            const firstInput = form.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Validación nativa del navegador
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (errorMsg) {
            errorMsg.setAttribute('hidden', '');
        }

        const rawFormData = new FormData(form);
        const currentLang = document.documentElement.lang || 'es';
        const isEn = currentLang === 'en';

        // 2. Anti-Spam / Bot Honeypot: Detección de bots
        const honeypotVal = rawFormData.get('_gotcha');
        const elapsedSinceInit = Date.now() - formInitTime;
        if (honeypotVal || elapsedSinceInit < 800) {
            // El bot rellenó el campo trampa o envió en tiempo no humano:
            // Simulamos éxito inmediato sin consumir peticiones en el backend ni propagar spam.
            form.style.display = 'none';
            successMsg.removeAttribute('hidden');
            if (window.lucide) lucide.createIcons();
            return;
        }

        // 3. Rate Limiting / Prevención de flood en cliente
        const lastSubmitTime = parseInt(sessionStorage.getItem(LAST_SUBMIT_KEY) || '0', 10);
        const now = Date.now();
        if (now - lastSubmitTime < COOLDOWN_MS) {
            const waitSec = Math.ceil((COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
            const errorTextEl = document.getElementById('form-error-text');
            if (errorTextEl) {
                errorTextEl.textContent = isEn
                    ? `Please wait ${waitSec} seconds before submitting another request.`
                    : `Por favor, espera ${waitSec} segundos antes de enviar otra solicitud.`;
            }
            if (errorMsg) {
                errorMsg.removeAttribute('hidden');
                errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        // 4. Sanitización Anti-CRLF / Email Header Injection (MITRE T1190 / NIST PR.DS-10)
        // Eliminamos retornos de carro (\r), saltos de línea (\n), tabuladores y bytes nulos (\0)
        const stripCRLF = (str) => typeof str === 'string' ? str.replace(/[\r\n\t\0]/g, ' ').trim() : '';

        const sanitizedData = new FormData();
        for (const [key, val] of rawFormData.entries()) {
            if (typeof val === 'string') {
                if (key === 'mensaje') {
                    // En el cuerpo del mensaje normalizamos saltos de línea y acotamos longitud máxima
                    sanitizedData.append(key, val.replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, 2500));
                } else if (key === '_gotcha') {
                    // Omitir campo trampa en el payload final
                } else {
                    // Campos de una sola línea (empresa, nombre, email, telefono, rango, _subject)
                    sanitizedData.append(key, stripCRLF(val).slice(0, 150));
                }
            } else {
                sanitizedData.append(key, val);
            }
        }

        // 5. Validación estricta de sintaxis de email en cliente
        const emailVal = sanitizedData.get('email') || '';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailVal)) {
            const emailInput = form.querySelector('#email');
            if (emailInput) {
                emailInput.setCustomValidity(isEn ? 'Please enter a valid email address.' : 'Por favor, introduce un correo electrónico válido.');
                emailInput.reportValidity();
                emailInput.addEventListener('input', () => emailInput.setCustomValidity(''), { once: true });
            }
            return;
        }

        const originalText = submitBtn.innerHTML;
        const sendingText = isEn ? 'Sending...' : 'Enviando...';

        submitBtn.innerHTML = `<span class="fs-form__submit-text">${sendingText}</span> <i data-lucide="loader" class="spin"></i>`;
        submitBtn.disabled = true;
        
        if (window.lucide) {
            lucide.createIcons();
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: sanitizedData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Registrar timestamp para el control de frecuencia
                sessionStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));

                form.style.display = 'none';
                if (errorMsg) errorMsg.setAttribute('hidden', '');
                successMsg.removeAttribute('hidden');
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                // 6. Analytics seguro con allowlist de rangos
                if (typeof gtag !== 'undefined') {
                    const allowedTiers = ['bronce', 'plata', 'oro', 'platino', 'especie', 'otro', 'bronze', 'silver', 'gold', 'platinum'];
                    const rawRango = String(sanitizedData.get('rango') || '').toLowerCase();
                    const safeRango = allowedTiers.includes(rawRango) ? rawRango : 'otro';

                    gtag('event', 'generate_lead', {
                        'event_category': 'Sponsorship',
                        'event_label': safeRango
                    });
                }
            } else {
                throw new Error('Formspree returned error: ' + response.status);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            if (errorMsg) {
                const errorTextEl = document.getElementById('form-error-text');
                if (errorTextEl) {
                    errorTextEl.innerHTML = isEn
                        ? 'There was a problem submitting your request. Please try again or email us directly at <a href="mailto:motomaqlabuc3m@uc3m.es">motomaqlabuc3m@uc3m.es</a>.'
                        : 'Hubo un problema al procesar tu solicitud. Por favor, inténtalo de nuevo o escríbenos directamente a <a href="mailto:motomaqlabuc3m@uc3m.es">motomaqlabuc3m@uc3m.es</a>.';
                }
                errorMsg.removeAttribute('hidden');
                if (window.lucide) {
                    lucide.createIcons();
                }
                errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    });
}

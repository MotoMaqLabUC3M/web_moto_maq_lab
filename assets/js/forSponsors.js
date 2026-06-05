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

            const duration = 2000; // ms
            const frameRate = 30;
            const totalFrames = Math.round((duration / 1000) * frameRate);
            let frame = 0;

            const updateCounter = () => {
                frame++;
                const progress = frame / totalFrames;
                // Easing out cube
                const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));

                numberEl.textContent = currentCount + suffix;

                if (frame < totalFrames) {
                    requestAnimationFrame(updateCounter);
                } else {
                    numberEl.textContent = target + suffix;
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
 * para evitar redirecciones y dar feedback visual.
 */
function initFormHandling() {
    const form = document.getElementById('sponsor-contact-form');
    const successMsg = document.getElementById('form-success');
    const submitBtn = document.getElementById('form-submit-btn');

    if (!form || !successMsg || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const originalText = submitBtn.innerHTML;
        const currentLang = document.documentElement.lang || 'es';
        const sendingText = currentLang === 'en' ? 'Sending...' : 'Enviando...';

        submitBtn.innerHTML = `<span class="fs-form__submit-text">${sendingText}</span> <i data-lucide="loader" class="spin"></i>`;
        submitBtn.disabled = true;
        
        // Re-init lucide icons for the spinner if it exists
        if (window.lucide) {
            lucide.createIcons();
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                form.style.display = 'none';
                successMsg.removeAttribute('hidden');
                
                // Track conversion si GA está presente
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'generate_lead', {
                        'event_category': 'Sponsorship',
                        'event_label': formData.get('rango')
                    });
                }
            } else {
                throw new Error('Formspree returned error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(currentLang === 'en' 
                ? 'There was an error sending the message. Please try again later.' 
                : 'Hubo un error al enviar el mensaje. Por favor, inténtalo más tarde.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

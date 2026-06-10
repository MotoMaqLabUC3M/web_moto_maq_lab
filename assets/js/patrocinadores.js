    function sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


/**
 * patrocinadores.js - Renders sponsor sections from JSON data
 * Links sponsors with dedicatedPage to their detail pages.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('sponsors-container');
    if (!container) return;

    const path = window.location.pathname;
    const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    const isEnglish = currentFile === 'sponsors.html' || currentFile === 'index-en.html';
    const JSON_PATH = isEnglish ? 'assets/data/patrocinadores-en.json' : 'assets/data/patrocinadores.json';

    try {
        const isEnglish = window.location.pathname.endsWith('-en.html') || window.location.pathname.endsWith('sponsors.html');
        const JSON_PATH = isEnglish ? 'assets/data/patrocinadores-en.json' : 'assets/data/patrocinadores.json';
        const response = await fetch(JSON_PATH);
        const data = await response.json();
        renderSponsorTiers(container, data.tiers);

        
    } catch (error) {
        console.error('Error loading sponsors data:', error);
        container.innerHTML = '<p>Error al cargar los datos de patrocinadores.</p>';
    }
});

/**
 * Renders all sponsor tiers into the container
 */
function renderSponsorTiers(container, tiers) {
    const html = tiers.map(tier => createTierHTML(tier)).join('');
    container.innerHTML = `<div class="sponsors-stack">${html}</div>`;
    // Init swipe carousels on mobile after DOM is ready
    requestAnimationFrame(initTierCarousels);
}

/**
 * Previously used for tier carousel - now a no-op since
 * silver/bronze use a CSS logo wall grid instead.
 */
function initTierCarousels() {
    // No-op: logo wall approach is handled entirely in CSS.
}



/**
 * Creates HTML for a single tier section
 */
function createTierHTML(tier) {
    const sponsorsHTML = tier.sponsors.map(sponsor => createSponsorCardHTML(sponsor, tier)).join('');

    return `
        <div class="sponsor-tier ${tier.cssClass}">
            <h3 class="tier-title">${tier.name}</h3>
            <div class="tier-list">
                ${sponsorsHTML}
            </div>
        </div>
    `;
}

/**
 * Creates HTML for a single sponsor card.
 * If the sponsor has a dedicatedPage, the card is wrapped in a link.
 */
function createSponsorCardHTML(sponsor, tier) {
    const isPlatinum = tier.id === 'platinum';
    const isGold = tier.id === 'gold';
    const isSilverOrBronze = tier.id === 'silver' || tier.id === 'bronze';

    const cardClass = isSilverOrBronze ? 'card mini-card' : 'card';

    let headingTag = 'h2';
    if (isGold) headingTag = 'h3';
    if (tier.id === 'silver') headingTag = 'h4';
    if (tier.id === 'bronze') headingTag = 'h5';

    // Add clickable class if has dedicated page or external website
    const hasLink = sponsor.dedicatedPage || sponsor.website;
    const clickableClass = hasLink ? ' card--clickable' : '';

    let cardContent = '';

    if (isPlatinum) {
        cardContent = `
            <div class="${cardClass}${clickableClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sanitize(sponsor.logo)}" alt="Logo de ${sanitize(sponsor.name)}" />
                </div>
                <div class="card-content">
                    <${headingTag}>${sanitize(sponsor.name)}</${headingTag}>
                    <p>${sanitize(sponsor.description)}</p>
                </div>
            </div>
        `;
    } else if (isGold) {
        cardContent = `
            <div class="${cardClass}${clickableClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sanitize(sponsor.logo)}" alt="Logo de ${sanitize(sponsor.name)}" />
                </div>
                <${headingTag}>${sanitize(sponsor.name)}</${headingTag}>
                <p>${sanitize(sponsor.description)}</p>
            </div>
        `;
    } else {
        cardContent = `
            <div class="${cardClass}${clickableClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sanitize(sponsor.logo)}" alt="Logo de ${sanitize(sponsor.name)}" />
                </div>
                <${headingTag}>${sanitize(sponsor.name)}</${headingTag}>
                <p>${sanitize(sponsor.description)}</p>
            </div>
        `;
    }

    // Wrap in link if has dedicated page or external website
    if (sponsor.dedicatedPage) {
        return `<a href="${sponsor.dedicatedPage}" class="sponsor-card-link" aria-label="Ver página de ${sanitize(sponsor.name)}">${cardContent}</a>`;
    } else if (sponsor.website) {
        return `<a href="${sponsor.website}" target="_blank" rel="noopener noreferrer" class="sponsor-card-link" aria-label="Visitar web de ${sanitize(sponsor.name)}">${cardContent}</a>`;
    }

    return cardContent;
}

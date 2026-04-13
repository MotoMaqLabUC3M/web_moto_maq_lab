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

    try {
        const response = await fetch('assets/data/patrocinadores.json');
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

    // Add clickable class if has dedicated page
    const clickableClass = sponsor.dedicatedPage ? ' card--clickable' : '';

    let cardContent = '';

    if (isPlatinum) {
        cardContent = `
            <div class="${cardClass}${clickableClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sanitize(sponsor.logo)}" alt="${sponsor.name}" />
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
                    <img src="${sanitize(sponsor.logo)}" alt="${sanitize(sponsor.name)}" />
                </div>
                <${headingTag}>${sanitize(sponsor.name)}</${headingTag}>
                <p>${sanitize(sponsor.description)}</p>
            </div>
        `;
    } else {
        cardContent = `
            <div class="${cardClass}${clickableClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sanitize(sponsor.logo)}" alt="${sanitize(sponsor.name)}" />
                </div>
                <${headingTag}>${sanitize(sponsor.name)}</${headingTag}>
                <p>${sanitize(sponsor.description)}</p>
            </div>
        `;
    }

    // Wrap in link if has dedicated page
    if (sponsor.dedicatedPage) {
        return `<a href="${sponsor.dedicatedPage}" class="sponsor-card-link">${cardContent}</a>`;
    }

    return cardContent;
}

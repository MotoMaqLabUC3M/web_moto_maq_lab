/**
 * patrocinadores.js - Renders sponsor sections from JSON data
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
 * @param {HTMLElement} container - The container element
 * @param {Array} tiers - Array of tier objects
 */
function renderSponsorTiers(container, tiers) {
    const html = tiers.map(tier => createTierHTML(tier)).join('');
    container.innerHTML = `<div class="sponsors-stack">${html}</div>`;
}

/**
 * Creates HTML for a single tier section
 * @param {Object} tier - Tier object with id, name, cssClass, logoSize, and sponsors
 * @returns {string} HTML string for the tier
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
 * Creates HTML for a single sponsor card
 * @param {Object} sponsor - Sponsor object with id, name, logo, description, website, dedicatedPage
 * @param {Object} tier - Parent tier object for sizing info
 * @returns {string} HTML string for the sponsor card
 */
function createSponsorCardHTML(sponsor, tier) {
    const isPlatinum = tier.id === 'platinum';
    const isGold = tier.id === 'gold';
    const isSilverOrBronze = tier.id === 'silver' || tier.id === 'bronze';

    // Determine card class based on tier
    const cardClass = isSilverOrBronze ? 'card mini-card' : 'card';

    // Determine heading tag based on tier
    let headingTag = 'h2';
    if (isGold) headingTag = 'h3';
    if (tier.id === 'silver') headingTag = 'h4';
    if (tier.id === 'bronze') headingTag = 'h5';

    // Build the card content based on tier type
    if (isPlatinum) {
        return `
            <div class="${cardClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sponsor.logo}" alt="${sponsor.name}" />
                </div>
                <div class="card-content">
                    <${headingTag}>${sponsor.name}</${headingTag}>
                    <p>${sponsor.description}</p>
                </div>
            </div>
        `;
    } else if (isGold) {
        return `
            <div class="${cardClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sponsor.logo}" alt="${sponsor.name}" />
                </div>
                <${headingTag}>${sponsor.name}</${headingTag}>
                <p>${sponsor.description}</p>
            </div>
        `;
    } else {
        // Silver and Bronze (mini-card style)
        return `
            <div class="${cardClass}">
                <div class="sponsor-logo-wrapper ${tier.logoSize}">
                    <img src="${sponsor.logo}" alt="${sponsor.name}" />
                </div>
                <${headingTag}>${sponsor.name}</${headingTag}>
                <p>${sponsor.description}</p>
            </div>
        `;
    }
}

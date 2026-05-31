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
 * equipo.js - Renders team sections from JSON data
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('team-sections');
    if (!container) return;

    try {
        const path = window.location.pathname;
        const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        const isEnglish = currentFile === 'team.html';
        const jsonPath = isEnglish ? 'assets/data/equipo-en.json' : 'assets/data/equipo.json';

        const response = await fetch(jsonPath);
        const data = await response.json();
        renderTeamSections(container, data.sections);
    } catch (error) {
        console.error('Error loading team data:', error);
        container.innerHTML = '<p>Error al cargar los datos del equipo.</p>';
    }
});

/**
 * Renders all team sections into the container
 * @param {HTMLElement} container - The container element
 * @param {Array} sections - Array of section objects
 */
function renderTeamSections(container, sections) {
    const html = sections.map(section => createSectionHTML(section)).join('');
    container.outerHTML = html;
}

/**
 * Creates HTML for a single section
 * @param {Object} section - Section object with id, title, and members
 * @returns {string} HTML string for the section
 */
function createSectionHTML(section) {
    const membersHTML = section.members.map(member => createMemberHTML(member)).join('');

    return `
        <section class="section-container">
            <div class="section-title">
                <h2>${section.title}</h2>
            </div>
            <div class="team-row">
                ${membersHTML}
            </div>
        </section>
    `;
}

/**
 * Creates HTML for a single team member card
 * @param {Object} member - Member object with name, role, image, and optional isPlaceholder
 * @returns {string} HTML string for the member card
 */
function createMemberHTML(member) {
    const placeholderClass = member.isPlaceholder ? ' class="placeholder-img"' : '';

    return `
        <div class="team-member-card">
            <img src="${sanitize(member.image)}" alt="Foto de ${sanitize(member.name)}, ${sanitize(member.role)} en MotoMaqLab UC3M"${placeholderClass} loading="lazy" decoding="async" width="250" height="350" />
            <h3>${sanitize(member.name)}</h3>
            <p>${sanitize(member.role)}</p>
        </div>
    `;
}

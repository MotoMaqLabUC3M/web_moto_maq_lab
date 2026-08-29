    function sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

const PLACEHOLDER_IMAGE = 'assets/img/logos_uc3m/uc3m_logo_sin_fondo.webp';

/**
 * equipo.js — Renderiza el equipo desde la API del CMS.
 *
 * El HTML estático entre <!-- TEAM_START --> y <!-- TEAM_END --> sirve
 * como fallback SEO si la API no responde. Cuando la API está disponible,
 * siempre sustituye ese contenido por los datos en vivo.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('team-sections');
    if (!container) return;

    const hasStaticFallback = Boolean(container.querySelector('.section-container'));

    if (!window.motoMaqLabCms) {
        if (!hasStaticFallback) {
            container.innerHTML = '<p>Error al cargar los datos del equipo.</p>';
        }
        return;
    }

    try {
        const lang = document.documentElement.lang || 'es';
        const data = await window.motoMaqLabCms.loadTeam(lang);
        if (!data.sections || data.sections.length === 0) {
            if (!hasStaticFallback) {
                container.innerHTML = '<p>No hay miembros publicados todavía.</p>';
            }
            return;
        }
        renderTeamSections(container, data.sections);
    } catch (error) {
        console.error('Error loading team data:', error);
        if (!hasStaticFallback) {
            container.innerHTML = '<p>Error al cargar los datos del equipo.</p>';
        }
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
    const membersHTML = section.members.map((member, index) => createMemberHTML(member, index)).join('');

    return `
        <section class="section-container">
            <div class="section-title">
                <h2>${sanitize(section.title)}</h2>
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
 * @param {number} index - Position within the section (0-based)
 * @returns {string} HTML string for the member card
 */
function createMemberHTML(member, index) {
    const imageSrc = member.image || PLACEHOLDER_IMAGE;
    const isPlaceholder = member.isPlaceholder || !member.image;
    const placeholderClass = isPlaceholder ? ' class="placeholder-img"' : '';
    const loadingAttr = index === 0 ? 'eager' : 'lazy';

    return `
        <div class="team-member-card">
            <img src="${sanitize(imageSrc)}" alt="Foto de ${sanitize(member.name)}, ${sanitize(member.role)} en MOTO-MAQLAB-UC3M"${placeholderClass} loading="${loadingAttr}" decoding="async" width="250" height="350" />
            <h3>${sanitize(member.name)}</h3>
            <p>${sanitize(member.role)}</p>
        </div>
    `;
}

const fs = require('fs');

function translateJson(src, dest, replacements) {
    let content = fs.readFileSync(src, 'utf8');
    for (const [es, en] of Object.entries(replacements)) {
        content = content.split(es).join(en);
    }
    fs.writeFileSync(dest, content, 'utf8');
}

// Equipo
translateJson('assets/data/equipo.json', 'assets/data/equipo-en.json', {
    '"title": "Dirección"': '"title": "Management"',
    '"title": "Dinámica"': '"title": "Dynamics"',
    '"title": "Aerodinámica y Composites"': '"title": "Aerodynamics & Composites"',
    '"title": "Electrónica y Telemetría"': '"title": "Electronics & Telemetry"',
    '"title": "Marketing y Patrocinios"': '"title": "Marketing & Sponsorships"',
    '"role": "Jefe de Equipo"': '"role": "Team Leader"',
    '"role": "Jefe de Aerodinámica"': '"role": "Aerodynamics Leader"',
    '"role": "Jefe de Dinámica"': '"role": "Dynamics Leader"',
    '"role": "Jefe de Electrónica"': '"role": "Electronics Leader"',
    '"role": "Jefe de Marketing"': '"role": "Marketing Leader"',
    '"role": "Miembro del equipo"': '"role": "Team Member"'
});

// Eventos
translateJson('assets/data/eventos.json', 'assets/data/eventos-en.json', {
    '"titulo": "Competición MotoStudent VIII"': '"titulo": "MotoStudent VIII Competition"',
    '"descripcion": "Pruebas dinámicas (MS2) y carrera final del prototipo MS8."': '"descripcion": "Dynamic tests (MS2) and final race of the MS8 prototype."',
    '"titulo": "Test Privado en Kotarr"': '"titulo": "Private Test at Kotarr"',
    '"lugar": "Circuito de Kotarr, Burgos"': '"lugar": "Kotarr Circuit, Burgos"',
    '"descripcion": "Jornada de pruebas aerodinámicas y ajustes de telemetría previos a la competición oficial."': '"descripcion": "Aerodynamic testing and telemetry tuning day prior to the official competition."',
    '"titulo": "Presentación Oficial MS8"': '"titulo": "Official MS8 Presentation"',
    '"lugar": "Campus de Leganés, UC3M"': '"lugar": "Leganés Campus, UC3M"',
    '"descripcion": "Desvelado del nuevo prototipo MS8 ante patrocinadores, autoridades y comunidad universitaria."': '"descripcion": "Unveiling of the new MS8 prototype to sponsors, authorities, and the university community."'
});

// Blog
translateJson('assets/data/blog.json', 'assets/data/blog-en.json', {
    '"titulo": "Avances en la Aerodinámica del MS8"': '"titulo": "Advances in MS8 Aerodynamics"',
    '"extracto": "Nuestro departamento de aerodinámica ha completado las simulaciones CFD del nuevo diseño del carenado. Reducción de drag estimada del 5%. Aquí te contamos los detalles técnicos y los próximos pasos en el túnel de viento."': '"extracto": "Our aerodynamics department has completed the CFD simulations of the new fairing design. Estimated drag reduction of 5%. Here we tell you the technical details and the next steps in the wind tunnel."',
    '"titulo": "Nuevo Acuerdo de Patrocinio con TechMotors"': '"titulo": "New Sponsorship Agreement with TechMotors"',
    '"extracto": "Estamos orgullosos de anunciar a TechMotors como patrocinador principal. Gracias a su apoyo, contaremos con componentes de telemetría de última generación para afinar el MS8 en pista."': '"extracto": "We are proud to announce TechMotors as our main sponsor. Thanks to their support, we will have state-of-the-art telemetry components to tune the MS8 on track."'
});

// Patrocinadores
translateJson('assets/data/patrocinadores.json', 'assets/data/patrocinadores-en.json', {
    '"name": "Platino"': '"name": "Platinum"',
    '"name": "PLATINO"': '"name": "PLATINUM"',
    '"name": "Oro"': '"name": "Gold"',
    '"name": "ORO"': '"name": "GOLD"',
    '"name": "Plata"': '"name": "Silver"',
    '"name": "PLATA"': '"name": "SILVER"',
    '"name": "Bronce"': '"name": "Bronze"',
    '"name": "BRONCE"': '"name": "BRONZE"',
    '"description": "Patrocinador Oficial de la Universidad"': '"description": "Official University Sponsor"',
    '"description": "Centro Tecnológico Universitario"': '"description": "University Technology Center"',
    '"description": "Ingeniería y Diseño de Competición"': '"description": "Engineering and Racing Design"',
    '"description": "Fabricación Avanzada"': '"description": "Advanced Manufacturing"',
    '"description": "Suspensiones Deportivas"': '"description": "Sports Suspensions"',
    '"description": "Neumáticos de Alta Competición"': '"description": "High Performance Racing Tires"',
    '"description": "Materiales Compuestos"': '"description": "Composite Materials"',
    '"description": "Mecanizados de Precisión"': '"description": "Precision Machining"',
    '"description": "Software CFD"': '"description": "CFD Software"',
    '"description": "Componentes Electrónicos"': '"description": "Electronic Components"',
    '"description": "Lubricantes Especiales"': '"description": "Special Lubricants"',
    '"description": "Diseño Gráfico y Vinilos"': '"description": "Graphic Design and Vinyls"',
    '"description": "Equipamiento de Seguridad"': '"description": "Safety Equipment"',
    '"description": "Herramientas de Taller"': '"description": "Workshop Tools"'
});

console.log('Translations complete.');

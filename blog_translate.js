const fs = require('fs');
let data = JSON.parse(fs.readFileSync('assets/data/blog.json', 'utf8'));

const translations = {
    "Newsletter - Revista MotoMaqLab": "Newsletter - MotoMaqLab Magazine",
    "¡Ya está disponible nuestra nueva Newsletter! Descarga el PDF para conocer los últimos avances del equipo, competiciones pasadas y nuestros próximos objetivos.": "Our new Newsletter is now available! Download the PDF to learn about the team's latest progress, past competitions, and our upcoming goals.",
    "Avances en la Aerodinámica del MS8": "Advances in MS8 Aerodynamics",
    "Nuestro departamento de aerodinámica ha completado las simulaciones CFD del nuevo diseño del carenado. Reducción de drag estimada del 5%. Aquí te contamos los detalles técnicos y los próximos pasos en el túnel de viento.": "Our aerodynamics department has completed the CFD simulations of the new fairing design. Estimated drag reduction of 5%. Here we tell you the technical details and the next steps in the wind tunnel.",
    "Nuevo Acuerdo de Patrocinio con TechMotors": "New Sponsorship Agreement with TechMotors",
    "Estamos orgullosos de anunciar a TechMotors como patrocinador principal. Gracias a su apoyo, contaremos con componentes de telemetría de última generación para afinar el MS8 en pista.": "We are proud to announce TechMotors as our main sponsor. Thanks to their support, we will have state-of-the-art telemetry components to tune the MS8 on track."
};

data.posts.forEach(post => {
    if (translations[post.titulo]) post.titulo = translations[post.titulo];
    if (translations[post.extracto]) post.extracto = translations[post.extracto];
});

fs.writeFileSync('assets/data/blog-en.json', JSON.stringify(data, null, 4), 'utf8');
console.log('blog-en.json created successfully.');

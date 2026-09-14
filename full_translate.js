const fs = require('fs');
let data = JSON.parse(fs.readFileSync('assets/data/patrocinadores.json', 'utf8'));

const translations = {
    "PLATINO": "PLATINUM",
    "ORO": "GOLD",
    "PLATA": "SILVER",
    "BRONCE": "BRONZE",
    "Maqlab colabora con el equipo aportando recursos de investigación y conocimiento en materiales y procesos de fabricación. Trabajamos con Maqlab para validar prototipos y ensayar nuevas técnicas de fabricación de piezas compuestas.": "Maqlab collaborates with the team by providing research resources and knowledge in materials and manufacturing processes. We work with Maqlab to validate prototypes and test new manufacturing techniques for composite parts.",
    "Altair nos aporta herramientas avanzadas de simulación multifísica y optimización. Aplicamos sus soluciones para optimizar diseños estructurales y el rendimiento aerodinámico de nuestras piezas.": "Altair provides us with advanced tools for multiphysics simulation and optimization. We apply their solutions to optimize structural designs and the aerodynamic performance of our parts.",
    "Addyx es nuestro socio en la fabricación de moldes hidrosolubles impresos en 3D. Destaca por su capacidad de realizar desde tiradas cortas mediante impresión 3D hasta producción en serie por rotomoldeo. Gracias a sus moldes hemos logrado fabricar nuestro chasis doble viga hueco, integrando el sistema de admisión, imposible de conseguir con otros métodos.": "Addyx is our partner in manufacturing 3D-printed water-soluble molds. They stand out for their ability to perform from short runs via 3D printing to mass production by rotational molding. Thanks to their molds we have managed to manufacture our hollow twin-spar chassis, integrating the intake system, impossible to achieve with other methods.",
    "La Universidad Carlos III de Madrid es nuestra institución y respaldo académico. Financia parte del proyecto y nos proporciona las instalaciones, talleres y laboratorios donde diseñamos y fabricamos nuestra moto. Además, contamos con el apoyo de profesores y tutores que nos guían en cada fase del desarrollo": "University Carlos III of Madrid is our institution and academic backing. It finances part of the project and provides us with the facilities, workshops, and laboratories where we design and manufacture our motorcycle. In addition, we have the support of professors and tutors who guide us in each phase of development.",
    "Retamal es un socio estratégico clave para Motomaqlab, aportándonos soporte logístico y organizativo fundamental para el correcto desarrollo del proyecto.": "Retamal is a key strategic partner for Motomaqlab, providing fundamental logistical and organizational support for the proper development of the project.",
    "Gurit nos suministra materiales compuestos y asesoramiento técnico para fabricar piezas ligeras y resistentes.": "Gurit supplies us with composite materials and technical advice to manufacture lightweight and resistant parts.",
    "Lasertek apoya con procesos láser de precisión para el prototipado.": "Lasertek supports with precision laser processes for prototyping.",
    "CESOL nos apoya con los procesos de soldadura y cursos complementarios a nuestros miembros para fomentar una formación continua y de calidad.": "CESOL supports us with welding processes and complementary courses for our members to promote continuous and quality training.",
    "NTN suministra rodamientos de alta calidad para nuestra transmisión y ruedas.": "NTN supplies high quality bearings for our transmission and wheels.",
    "Solysol aporta tecnología de soldadura láser para la fabricación del sistema de escape.": "Solysol provides laser welding technology for the manufacturing of the exhaust system.",
    "Apoyo en procesos de certificación y calidad.": "Support in certification and quality processes.",
    "SolidWorks nos proporciona licencias y apoyo en modelado CAD y simulación básica.": "SolidWorks provides us with licenses and support in CAD modeling and basic simulation.",
    "Castrol suministra lubricantes y asesoramiento para optimizar el rendimiento del motor.": "Castrol supplies lubricants and advice to optimize engine performance.",
    "Bollhoff provee soluciones de fijación y tecnologías de unión.": "Bollhoff provides fastening solutions and joining technologies.",
    "Facom nos apoya con herramientas de taller y formación.": "Facom supports us with workshop tools and training.",
    "CIMWORKS colabora en procesos de fabricación y software de producción.": "CIMWORKS collaborates in manufacturing processes and production software.",
    "Bossard apoya con componentes y sistemas de ensamblaje.": "Bossard supports with components and assembly systems.",
    "Valmoldes produce moldes y piezas a medida para nuestros componentes compuestos.": "Valmoldes produces custom molds and parts for our composite components.",
    "Würth Elektronik proporciona componentes electrónicos para nuestra moto.": "Würth Elektronik provides electronic components for our motorcycle.",
    "NG Brakes nos proporciona discos de freno de alta competición, garantizando el máximo rendimiento y seguridad en pista.": "NG Brakes provides us with high-competition brake discs, guaranteeing maximum performance and safety on track.",
    "COGITIM colabora en procesos de ingeniería y optimización.": "COGITIM collaborates in engineering and optimization processes.",
    "Suministro de materias primas y asesoría técnica en composites.": "Supply of raw materials and technical advice in composites.",
    "Frade nos proporciona Equipos de Protección Individual (EPIs), garantizando la seguridad de nuestro equipo en el taller.": "Frade provides us with Personal Protective Equipment (PPE), ensuring the safety of our team in the workshop."
};

data.tiers.forEach(tier => {
    if (translations[tier.name]) tier.name = translations[tier.name];
    tier.sponsors.forEach(sponsor => {
        if (sponsor.description && translations[sponsor.description]) {
            sponsor.description = translations[sponsor.description];
        }
    });
});

fs.writeFileSync('assets/data/patrocinadores-en.json', JSON.stringify(data, null, 4), 'utf8');
console.log('patrocinadores-en.json created successfully.');

package seo

// StaticPage is a crawlable URL that does not come from the CMS.
type StaticPage struct {
	Path        string
	Changefreq  string
	Priority    string
	AlternateES string
	AlternateEN string
	Image       string
	ImageAlt    string
}

// StaticPages are the public HTML routes that Google should keep in the sitemap
// regardless of CMS content. Templates (noticia.html, news.html, evento.html)
// are intentionally omitted: they are thin shells and stay noindex.
func StaticPages() []StaticPage {
	return []StaticPage{
		{Path: "/", Changefreq: "weekly", Priority: "1.0", AlternateES: "/", AlternateEN: "/index-en.html", Image: "/assets/img/home/equipo_index.webp", ImageAlt: "Equipo MOTO-MAQLAB-UC3M con el prototipo MotoStudent"},
		{Path: "/index-en.html", Changefreq: "weekly", Priority: "1.0", AlternateES: "/", AlternateEN: "/index-en.html", Image: "/assets/img/home/equipo_index.webp", ImageAlt: "MOTO-MAQLAB-UC3M team with the MotoStudent prototype"},
		{Path: "/unete.html", Changefreq: "monthly", Priority: "0.9", AlternateES: "/unete.html", Image: "/assets/img/home/header_unete.webp", ImageAlt: "Únete al equipo MOTO-MAQLAB-UC3M"},
		{Path: "/sobre-nosotros.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/sobre-nosotros.html", AlternateEN: "/about-us.html", Image: "/assets/img/hero/sobre-nosotros.webp", ImageAlt: "Equipo MOTO-MAQLAB-UC3M en MotorLand Aragón"},
		{Path: "/about-us.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/sobre-nosotros.html", AlternateEN: "/about-us.html", Image: "/assets/img/hero/sobre-nosotros.webp", ImageAlt: "MOTO-MAQLAB-UC3M team at MotorLand Aragón"},
		{Path: "/equipo.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/equipo.html", AlternateEN: "/team.html", Image: "/assets/img/hero/equipo.webp", ImageAlt: "Equipo MOTO-MAQLAB-UC3M"},
		{Path: "/team.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/equipo.html", AlternateEN: "/team.html", Image: "/assets/img/hero/equipo.webp", ImageAlt: "MOTO-MAQLAB-UC3M team"},
		{Path: "/patrocinadores.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/patrocinadores.html", AlternateEN: "/sponsors.html", Image: "/assets/img/hero/patrocinadores.webp", ImageAlt: "Patrocinadores de MOTO-MAQLAB-UC3M"},
		{Path: "/sponsors.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/patrocinadores.html", AlternateEN: "/sponsors.html", Image: "/assets/img/hero/patrocinadores.webp", ImageAlt: "MOTO-MAQLAB-UC3M sponsors"},
		{Path: "/para-patrocinadores.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/para-patrocinadores.html", AlternateEN: "/for-sponsors.html", Image: "/assets/img/hero/patrocinadores.webp", ImageAlt: "Colabora con MOTO-MAQLAB-UC3M"},
		{Path: "/for-sponsors.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/para-patrocinadores.html", AlternateEN: "/for-sponsors.html", Image: "/assets/img/hero/patrocinadores.webp", ImageAlt: "Partner with MOTO-MAQLAB-UC3M"},
		{Path: "/eventos.html", Changefreq: "weekly", Priority: "0.8", AlternateES: "/eventos.html", AlternateEN: "/events.html", Image: "/assets/img/hero/eventos.webp", ImageAlt: "Eventos MOTO-MAQLAB-UC3M"},
		{Path: "/events.html", Changefreq: "weekly", Priority: "0.8", AlternateES: "/eventos.html", AlternateEN: "/events.html", Image: "/assets/img/hero/eventos.webp", ImageAlt: "MOTO-MAQLAB-UC3M events"},
		{Path: "/blog.html", Changefreq: "weekly", Priority: "0.8", AlternateES: "/blog.html", AlternateEN: "/blog-en.html", Image: "/assets/img/hero/blog.webp", ImageAlt: "Blog MOTO-MAQLAB-UC3M"},
		{Path: "/blog-en.html", Changefreq: "weekly", Priority: "0.8", AlternateES: "/blog.html", AlternateEN: "/blog-en.html", Image: "/assets/img/hero/blog.webp", ImageAlt: "MOTO-MAQLAB-UC3M blog"},
		{Path: "/motostudent.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/motostudent.html", AlternateEN: "/motostudent-en.html", Image: "/assets/img/motostudent/moto_en_pista.jpeg", ImageAlt: "Prototipo MOTO-MAQLAB-UC3M en MotorLand Aragón"},
		{Path: "/motostudent-en.html", Changefreq: "monthly", Priority: "0.8", AlternateES: "/motostudent.html", AlternateEN: "/motostudent-en.html", Image: "/assets/img/motostudent/moto_en_pista.jpeg", ImageAlt: "MOTO-MAQLAB-UC3M prototype at MotorLand Aragón"},
		{Path: "/media.html", Changefreq: "weekly", Priority: "0.7", AlternateES: "/media.html", Image: "/assets/img/hero/blog.webp", ImageAlt: "Media y prensa MOTO-MAQLAB-UC3M"},
		{Path: "/ms8.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/ms8.html", Image: "/assets/img/timeline/2025.webp", ImageAlt: "Prototipo MS8 MOTO-MAQLAB-UC3M"},
		{Path: "/patrocinador-maqlab.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-maqlab.html", AlternateEN: "/sponsor-maqlab.html"},
		{Path: "/sponsor-maqlab.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-maqlab.html", AlternateEN: "/sponsor-maqlab.html"},
		{Path: "/patrocinador-altair.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-altair.html", AlternateEN: "/sponsor-altair.html"},
		{Path: "/sponsor-altair.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-altair.html", AlternateEN: "/sponsor-altair.html"},
		{Path: "/patrocinador-addyx.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-addyx.html", AlternateEN: "/sponsor-addyx.html"},
		{Path: "/sponsor-addyx.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-addyx.html", AlternateEN: "/sponsor-addyx.html"},
		{Path: "/patrocinador-UC3M.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-UC3M.html", AlternateEN: "/sponsor-UC3M.html"},
		{Path: "/sponsor-UC3M.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-UC3M.html", AlternateEN: "/sponsor-UC3M.html"},
		{Path: "/patrocinador-retamal.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-retamal.html", AlternateEN: "/sponsor-retamal.html"},
		{Path: "/sponsor-retamal.html", Changefreq: "monthly", Priority: "0.7", AlternateES: "/patrocinador-retamal.html", AlternateEN: "/sponsor-retamal.html"},
	}
}

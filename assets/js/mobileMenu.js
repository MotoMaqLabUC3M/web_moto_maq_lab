function initMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".mobile-menu");

    if (!hamburger || !menu) return;

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        menu.classList.toggle("active");
    });

    document.querySelectorAll(".mobile-menu a").forEach((link) => {
        link.addEventListener("click", () => {
            hamburger.classList.remove("active");
            menu.classList.remove("active");
        });
    });
}

// Wait for layout.js to inject header, or run immediately if header already exists
if (document.querySelector(".hamburger")) {
    initMobileMenu();
} else {
    document.addEventListener("layoutReady", initMobileMenu);
}

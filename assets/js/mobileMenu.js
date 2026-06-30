function initMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const menu = document.querySelector(".mobile-menu");

    if (!hamburger || !menu) return;

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        menu.classList.toggle("active");
    });

    document.querySelectorAll(".mobile-menu a").forEach((link) => {
        link.addEventListener("click", (e) => {
            // Only intercept dropdown toggles when the hamburger is visible (mobile)
            const hamburgerVisible = window.getComputedStyle(hamburger).display !== "none";
            if (link.classList.contains("nav-dropdown-toggle") && hamburgerVisible) {
                e.preventDefault();
                const dropdown = link.parentElement;
                // Close other open dropdowns
                document.querySelectorAll(".nav-dropdown.active").forEach(d => {
                    if (d !== dropdown) d.classList.remove("active");
                });
                dropdown.classList.toggle("active");
                return;
            }
            // Close mobile menu when navigating
            if (hamburgerVisible) {
                hamburger.classList.remove("active");
                menu.classList.remove("active");
            }
        });
    });
}

// Wait for layout.js to inject header, or run immediately if header already exists
if (document.querySelector(".hamburger")) {
    initMobileMenu();
} else {
    document.addEventListener("layoutReady", initMobileMenu);
}

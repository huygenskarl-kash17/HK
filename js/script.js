document.addEventListener("DOMContentLoaded", () => {

    /* ---------- MENU MOBILE ---------- */
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("nav ul");
    if (toggle && nav) {
        toggle.addEventListener("click", () => nav.classList.toggle("active"));
        nav.querySelectorAll("a").forEach(lien => lien.addEventListener("click", () => nav.classList.remove("active")));
    }

    /* ---------- HEADER RETRECI AU SCROLL ---------- */
    const header = document.querySelector("header");
    if (header) {
        window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 30));
    }

    /* ---------- ANIMATIONS AU DEFILEMENT ---------- */
    const observateur = new IntersectionObserver((entrees) => {
        entrees.forEach(entree => { if (entree.isIntersecting) entree.target.classList.add("active"); });
    }, { threshold: 0.15 });

    function activerReveal(){
        document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-zoom").forEach(el => observateur.observe(el));
    }
    window.activerReveal = activerReveal;
    activerReveal();

    /* ---------- COMPTEURS ANIMES ---------- */
    const compteurs = document.querySelectorAll(".stat-num[data-count]");
    function lancerCompteur(el){
        const cible = parseInt(el.dataset.count, 10);
        const duree = 1400;
        const debut = performance.now();
        function etape(maintenant){
            const progres = Math.min((maintenant - debut) / duree, 1);
            el.textContent = Math.floor(progres * cible);
            if (progres < 1) requestAnimationFrame(etape); else el.textContent = cible;
        }
        requestAnimationFrame(etape);
    }
    if (compteurs.length) {
        const obsCompteur = new IntersectionObserver((entrees) => {
            entrees.forEach(entree => { if (entree.isIntersecting){ lancerCompteur(entree.target); obsCompteur.unobserve(entree.target); } });
        }, { threshold: 0.5 });
        compteurs.forEach(el => obsCompteur.observe(el));
    }

    /* ---------- TOAST ---------- */
    window.afficherToast = function(texte){
        const toast = document.getElementById("toast");
        if(!toast) return;
        toast.textContent = texte;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
    };

});

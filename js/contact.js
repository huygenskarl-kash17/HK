/* =========================================================
   PAGE CONTACT — formulaire, validation, envoi
   Le site étant 100% statique (sans serveur), l'envoi se fait
   via un lien "mailto:" pré-rempli : le message s'ouvre dans
   l'application e-mail du visiteur, prêt à être envoyé.
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {

    /* ---------- CONTENU DE LA PAGE (100% depuis data/contact-info.json) ---------- */
    let INFOS = null;
    try{
        const res = await fetch("data/contact-info.json");
        INFOS = await res.json();
    }catch(e){
        console.warn("Impossible de charger data/contact-info.json", e);
    }

    const EMAIL_DESTINATION = (INFOS && INFOS.coordonnees) ? INFOS.coordonnees.email : "secretariat@ententekipushi.cd";

    if(INFOS){
        const oeilTexte = document.getElementById("contact-oeil-texte");
        if(oeilTexte) oeilTexte.textContent = INFOS.hero.oeil;

        const titre = document.getElementById("contact-titre");
        if(titre) titre.innerHTML = `${INFOS.hero.titre_avant}<span>${INFOS.hero.titre_accent}</span>`;

        const texte = document.getElementById("contact-texte");
        if(texte) texte.textContent = INFOS.hero.texte;

        const confiance = document.getElementById("contact-confiance");
        if(confiance) confiance.innerHTML = INFOS.hero.confiance.map(c =>
            `<div class="confiance-chip"><i class="${c.icone}"></i><span>${c.texte}</span></div>`
        ).join("");

        const sujetSelect = document.getElementById("cSujet");
        if(sujetSelect && INFOS.sujets_formulaire){
            sujetSelect.innerHTML = `<option value="" disabled selected>Choisissez un objet</option>` +
                INFOS.sujets_formulaire.map(s => `<option value="${s}">${s}</option>`).join("");
        }

        const coord = INFOS.coordonnees;
        const coordUl = document.getElementById("contact-coordonnees");
        if(coordUl && coord){
            coordUl.innerHTML = `
                <li>
                    <span class="info-icone info-icone-adresse"><i class="fa-solid fa-location-dot"></i></span>
                    <div><strong>${coord.adresse_nom}</strong><span>${coord.adresse}</span>
                    <a href="#carte">Voir sur la carte →</a></div>
                </li>
                <li>
                    <span class="info-icone info-icone-tel"><i class="fa-solid fa-phone"></i></span>
                    <div><strong>Téléphone</strong><a href="tel:+${coord.telephone_lien}">${coord.telephone}</a>
                    <span class="info-horaires"><i class="fa-solid fa-clock"></i> ${coord.horaires}</span></div>
                </li>
                <li>
                    <span class="info-icone info-icone-email"><i class="fa-solid fa-envelope"></i></span>
                    <div><strong>E-mail</strong><a href="mailto:${coord.email}">${coord.email}</a></div>
                </li>`;
        }

        if(INFOS.whatsapp){
            const lienWA = `https://wa.me/${INFOS.whatsapp.numero}?text=${encodeURIComponent(INFOS.whatsapp.message_pre_rempli)}`;
            const cta = document.getElementById("contact-whatsapp-cta");
            if(cta) cta.href = lienWA;
            const flottant = document.getElementById("contact-whatsapp-flottant");
            if(flottant) flottant.href = lienWA;
        }

        const reseauxWrap = document.getElementById("contact-reseaux");
        if(reseauxWrap && INFOS.reseaux_sociaux){
            reseauxWrap.innerHTML = INFOS.reseaux_sociaux.map(r =>
                `<a href="${r.lien}" target="_blank" class="chip-social ${r.classe}"><i class="${r.icone}"></i> ${r.nom}</a>`
            ).join("");
        }

        const faqWrap = document.getElementById("contact-faq");
        if(faqWrap && INFOS.faq){
            faqWrap.innerHTML = INFOS.faq.map(f =>
                `<details class="faq-item reveal" ${f.ouvert_par_defaut ? "open" : ""}>
                    <summary><span>${f.question}</span><i class="fa-solid fa-chevron-down"></i></summary>
                    <p>${f.reponse}</p>
                </details>`
            ).join("");
        }

        if(INFOS.carte){
            const embed = document.getElementById("contact-carte-embed");
            if(embed) embed.src = INFOS.carte.embed_url;
            const legende = document.getElementById("contact-carte-legende");
            if(legende) legende.innerHTML = INFOS.carte.legende;
            const lienMaps = document.getElementById("contact-carte-lien");
            if(lienMaps) lienMaps.href = INFOS.carte.maps_lien;
        }

        if(window.activerReveal) window.activerReveal();
    }

    /* ---------- FORMULAIRE : validation + envoi (inchangé) ---------- */
    const form = document.getElementById("formContact");
    if (!form) return;

    const champMessage = document.getElementById("cMessage");
    const compteur = document.getElementById("compteurMsg");
    const formSucces = document.getElementById("formSucces");
    const btnNouveauMessage = document.getElementById("btnNouveauMessage");

    /* ---------- COMPTEUR DE CARACTERES ---------- */
    if (champMessage && compteur) {
        const maj = () => { compteur.textContent = `${champMessage.value.length} / 600`; };
        champMessage.addEventListener("input", maj);
        maj();
    }

    /* ---------- VALIDATION + ENVOI ---------- */
    function champValide(champ){
        const bloc = champ.closest(".champ");
        const valide = champ.checkValidity();
        if (bloc) bloc.classList.toggle("invalide", !valide);
        return valide;
    }

    form.querySelectorAll("input, select, textarea").forEach(champ => {
        champ.addEventListener("blur", () => { if (champ.hasAttribute("required")) champValide(champ); });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const requis = form.querySelectorAll("[required]");
        let toutValide = true;
        requis.forEach(champ => { if (!champValide(champ)) toutValide = false; });

        if (!toutValide) {
            const premierInvalide = form.querySelector(".invalide input, .invalide select, .invalide textarea");
            if (premierInvalide) premierInvalide.focus();
            if (window.afficherToast) window.afficherToast("Merci de compléter les champs obligatoires.");
            return;
        }

        const nom = form.nom.value.trim();
        const email = form.email.value.trim();
        const telephone = form.telephone.value.trim();
        const sujet = form.sujet.value;
        const message = form.message.value.trim();
        const newsletter = form.newsletter.checked;

        const objet = encodeURIComponent(`[Site Entente de Kipushi] ${sujet}`);
        const lignes = [
            `Nom : ${nom}`,
            `E-mail : ${email}`,
            telephone ? `Téléphone : ${telephone}` : null,
            `Objet : ${sujet}`,
            "",
            message,
            "",
            newsletter ? "— souhaite recevoir les actualités de l'Entente de Kipushi." : null
        ].filter(Boolean).join("\n");

        const lienMailto = `mailto:${EMAIL_DESTINATION}?subject=${objet}&body=${encodeURIComponent(lignes)}`;

        window.location.href = lienMailto;

        form.hidden = true;
        formSucces.hidden = false;
        formSucces.scrollIntoView({ behavior: "smooth", block: "center" });
        if (window.afficherToast) window.afficherToast("Message prêt à être envoyé !");
    });

    if (btnNouveauMessage) {
        btnNouveauMessage.addEventListener("click", () => {
            form.reset();
            form.hidden = false;
            formSucces.hidden = true;
            form.querySelectorAll(".invalide").forEach(el => el.classList.remove("invalide"));
            if (compteur) compteur.textContent = "0 / 600";
            form.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }
});

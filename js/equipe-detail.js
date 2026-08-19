/* =========================================================
   FICHE ÉQUIPE — logique de la page equipe.html
   Lit teams.json, club-profils.json, joueurs.json, scores.json
   et standings.json pour construire la page à partir du
   paramètre ?equipe=slug présent dans l'URL.
   ========================================================= */

async function edFetchJSON(chemin){
    try{
        const reponse = await fetch(chemin + "?t=" + Date.now());
        if(!reponse.ok) throw new Error("Réponse invalide");
        return await reponse.json();
    }catch(e){
        console.warn("Impossible de charger", chemin, e);
        return null;
    }
}

function edParamEquipe(){
    const params = new URLSearchParams(window.location.search);
    return params.get("equipe");
}

document.addEventListener("DOMContentLoaded", async () => {

    const slug = edParamEquipe();

    const [teams, profils, joueursParEquipe, scores, standings] = await Promise.all([
        edFetchJSON("data/teams.json"),
        edFetchJSON("data/club-profils.json"),
        edFetchJSON("data/joueurs.json"),
        edFetchJSON("data/scores.json"),
        edFetchJSON("data/standings.json")
    ]);

    const equipe = teams ? teams.find(t => t.slug === slug) : null;

    if(!equipe){
        document.getElementById("equipe-introuvable").style.display = "block";
        document.getElementById("equipe-contenu").style.display = "none";
        return;
    }

    document.title = equipe.nom + " - Entente de Kipushi";

    const profil = (profils && profils[equipe.slug]) || {};
    const fichesEquipe = (joueursParEquipe && joueursParEquipe[equipe.slug]) || {};
    const staffTechnique = Array.isArray(fichesEquipe) ? [] : (fichesEquipe.staff || []);
    const joueurs = Array.isArray(fichesEquipe) ? fichesEquipe : (fichesEquipe.joueurs || []);

    /* ---------- POSITION ACTUELLE AU CLASSEMENT ---------- */
    let ligneClassement = null;
    if(standings && standings.classement){
        ligneClassement = standings.classement.find(e => e.nom === equipe.nom);
    }

    /* ---------- HERO ---------- */
    const hero = document.getElementById("equipe-hero");
    hero.style.setProperty("--hero-couleur", equipe.couleur || "var(--noir)");
    hero.innerHTML = `
        <img src="${equipe.badge}" alt="${equipe.nom}" class="hero-badge">
        <h1 class="hero-nom">${equipe.nom}</h1>
        ${profil.surnom ? `<p class="hero-surnom">« ${profil.surnom} »</p>` : ""}
        <div class="hero-maillot">
            <span style="background:${equipe.couleur};"></span>
            <span style="background:${equipe.accent || '#ffffff'};"></span>
        </div>
        <div class="hero-infos">
            ${equipe.code ? `<span class="hero-chip"><i class="fa-solid fa-hashtag"></i> ${equipe.code}</span>` : ""}
            ${profil.fondation ? `<span class="hero-chip"><i class="fa-solid fa-calendar"></i> Fondé en ${profil.fondation}</span>` : ""}
            ${profil.stade ? `<span class="hero-chip"><i class="fa-solid fa-location-dot"></i> ${profil.stade}</span>` : ""}
            ${ligneClassement ? `<span class="hero-chip chip-pos"><i class="fa-solid fa-ranking-star"></i> ${ligneClassement.rang}${ligneClassement.rang===1?'ère':'ème'} place — ${ligneClassement.pts} pts</span>` : ""}
        </div>
    `;

    /* ---------- ONGLETS ---------- */
    const boutons = document.querySelectorAll(".onglet-btn");
    boutons.forEach(btn => {
        btn.addEventListener("click", () => {
            boutons.forEach(b => b.classList.remove("actif"));
            document.querySelectorAll(".onglet-panneau").forEach(p => p.classList.remove("actif"));
            btn.classList.add("actif");
            document.getElementById(btn.dataset.cible).classList.add("actif");
        });
    });

    /* ---------- HISTOIRE ---------- */
    const blocHistoire = document.getElementById("bloc-histoire");
    blocHistoire.innerHTML = `
        <h3><i class="fa-solid fa-book-open"></i> Histoire du club</h3>
        <p>${profil.histoire || "L'histoire de ce club n'a pas encore été renseignée. Rendez-vous dans data/club-profils.json pour l'ajouter."}</p>
        ${profil.fait_marquant ? `<div class="fait-marquant"><i class="fa-solid fa-star"></i>${profil.fait_marquant}</div>` : ""}
    `;

    /* ---------- PALMARES ---------- */
    const palmaresListe = document.getElementById("palmares-liste");
    if(profil.palmares && profil.palmares.length){
        palmaresListe.innerHTML = profil.palmares.map(p => `
            <li>
                <span class="pal-icone"><i class="fa-solid fa-trophy"></i></span>
                <span class="pal-texte"><strong>${p.titre}</strong><span>${p.saison}</span></span>
            </li>
        `).join("");
    } else {
        palmaresListe.innerHTML = `<li>Aucun palmarès renseigné pour le moment.</li>`;
    }

    /* ---------- STAFF TECHNIQUE (entraîneur + adjoint) ---------- */
    const grilleStaff = document.getElementById("staff-grille");
    const titreStaff = document.getElementById("staff-titre");
    if(grilleStaff){
        if(staffTechnique.length){
            if(titreStaff) titreStaff.style.display = "";
            grilleStaff.innerHTML = staffTechnique.map((s, i) => `
                <div class="joueur-card staff-card" style="--i:${i % 8}">
                    <div class="joueur-photo-wrap">
                        <img src="${s.photo || 'images/joueur-placeholder.svg'}" alt="${s.nom}" loading="lazy">
                        <span class="joueur-poste">${s.role}</span>
                    </div>
                    <p class="joueur-nom">${s.nom}</p>
                </div>
            `).join("");
        } else {
            grilleStaff.style.display = "none";
        }
    }

    /* ---------- EFFECTIF ---------- */
    const grilleJoueurs = document.getElementById("joueurs-grille");
    function afficherJoueurs(liste){
        if(!liste.length){
            grilleJoueurs.innerHTML = `<p class="aucun-joueur">Aucun joueur ne correspond à cette recherche.</p>`;
            return;
        }
        grilleJoueurs.innerHTML = liste.map((j, i) => `
            <div class="joueur-card" style="--i:${i % 8}">
                <div class="joueur-photo-wrap">
                    <img src="${j.photo || 'images/joueur-placeholder.svg'}" alt="${j.nom}" loading="lazy">
                    <span class="joueur-numero">${j.numero}</span>
                    <span class="joueur-poste">${j.poste}</span>
                </div>
                <p class="joueur-nom">${j.nom}</p>
            </div>
        `).join("");
    }
    afficherJoueurs(joueurs);

    const rechercheJoueur = document.getElementById("recherche-joueur");
    rechercheJoueur.addEventListener("input", () => {
        const terme = rechercheJoueur.value.trim().toLowerCase();
        afficherJoueurs(joueurs.filter(j => j.nom.toLowerCase().includes(terme)));
    });

    /* ---------- PARCOURS ---------- */
    const resume = document.getElementById("parcours-resume");
    const conteneurMatchs = document.getElementById("parcours-matchs");

    if(scores && scores.matchs){
        const matchsEquipe = scores.matchs.filter(m => m.domicile === equipe.nom || m.exterieur === equipe.nom);
        const termines = matchsEquipe.filter(m => m.statut === "termine");

        let v=0, n=0, d=0, bp=0, bc=0;
        termines.forEach(m => {
            const domicile = m.domicile === equipe.nom;
            const bMarques = domicile ? m.score_domicile : m.score_exterieur;
            const bEncaisses = domicile ? m.score_exterieur : m.score_domicile;
            bp += bMarques; bc += bEncaisses;
            if(bMarques > bEncaisses) v++; else if(bMarques === bEncaisses) n++; else d++;
        });

        resume.innerHTML = `
            <div class="parcours-chip" style="--i:0"><div class="pc-valeur">${termines.length}</div><div class="pc-label">Joués</div></div>
            <div class="parcours-chip" style="--i:1"><div class="pc-valeur">${v}</div><div class="pc-label">Victoires</div></div>
            <div class="parcours-chip" style="--i:2"><div class="pc-valeur">${n}</div><div class="pc-label">Nuls</div></div>
            <div class="parcours-chip" style="--i:3"><div class="pc-valeur">${d}</div><div class="pc-label">Défaites</div></div>
            <div class="parcours-chip pc-rang" style="--i:4"><div class="pc-valeur">${bp}-${bc}</div><div class="pc-label">Buts (P-C)</div></div>
        `;

        if(matchsEquipe.length){
            conteneurMatchs.innerHTML = `<div class="journee-bloc"><div class="match-list"></div></div>`;
            const liste = conteneurMatchs.querySelector(".match-list");
            matchsEquipe.forEach(m => {
                const domicile = m.domicile === equipe.nom;
                const adversaire = domicile ? m.exterieur : m.domicile;
                let etiquette = "";
                if(m.statut === "termine"){
                    const bMarques = domicile ? m.score_domicile : m.score_exterieur;
                    const bEncaisses = domicile ? m.score_exterieur : m.score_domicile;
                    const type = bMarques > bEncaisses ? "victoire" : (bMarques === bEncaisses ? "nul" : "defaite");
                    const libelle = type === "victoire" ? "Victoire" : (type === "nul" ? "Nul" : "Défaite");
                    etiquette = `<span class="parcours-resultat ${type}">${libelle}</span>`;
                }
                const row = document.createElement("div");
                row.className = "match-row";
                const statutHTML = m.statut === "live"
                    ? '<span class="statut-badge live"><span class="dot"></span> Live</span>'
                    : (m.statut === "termine" ? '<span class="statut-badge termine">Terminé</span>' : '<span class="statut-badge a_venir">À venir</span>');
                const scoreHTML = (m.statut === "a_venir")
                    ? `<span class="heure-match">${m.heure}</span>`
                    : `<span class="score-inline">${m.score_domicile} — ${m.score_exterieur}</span>`;
                row.innerHTML = `
                    ${statutHTML}
                    <div class="match-teams">
                        <div class="team-side"><span>${domicile ? equipe.nom : adversaire}</span></div>
                        <div class="score-zone">${scoreHTML}<br>${etiquette}</div>
                        <div class="team-side away"><span>${domicile ? adversaire : equipe.nom}</span></div>
                    </div>
                    <div style="width:100%;text-align:center;font-size:0.78rem;color:var(--texte-doux);margin-top:4px;">
                        Journée ${m.journee} — ${m.jour} ${m.date}
                    </div>
                `;
                liste.appendChild(row);
            });
        } else {
            conteneurMatchs.innerHTML = `<p class="aucun-match">Aucun match programmé pour le moment.</p>`;
        }
    }

    /* ---------- MEDIAS : GALERIE PHOTOS ---------- */
    const galerie = document.getElementById("galerie-grille");
    const photos = (profil.photos && profil.photos.length) ? profil.photos : [];
    if(photos.length){
        galerie.innerHTML = photos.map((src, i) => `
            <div class="galerie-item" style="--i:${i}" data-src="${src}">
                <img src="${src}" alt="${equipe.nom} - photo ${i+1}" loading="lazy">
            </div>
        `).join("");
    } else {
        galerie.innerHTML = `<p class="aucune-video">Aucune photo publiée pour le moment.</p>`;
    }

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    galerie.addEventListener("click", (e) => {
        const item = e.target.closest(".galerie-item");
        if(!item) return;
        lightboxImg.src = item.dataset.src;
        lightbox.classList.add("actif");
    });
    document.getElementById("lightbox-fermer").addEventListener("click", () => lightbox.classList.remove("actif"));
    lightbox.addEventListener("click", (e) => { if(e.target === lightbox) lightbox.classList.remove("actif"); });

    /* ---------- MEDIAS : VIDEOS ---------- */
    const videosGrille = document.getElementById("videos-grille");
    if(profil.videos && profil.videos.length){
        videosGrille.innerHTML = profil.videos.map(v => `
            <div class="video-carte">
                <div class="video-wrap"><iframe src="https://www.youtube.com/embed/${v.youtube_id}" allowfullscreen></iframe></div>
                <h4>${v.titre}</h4>
            </div>
        `).join("");
    }

    if(window.activerReveal) window.activerReveal();
});

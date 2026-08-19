# Guide d'administration — Entente de Kipushi

Ce site est conçu pour qu'**une seule personne, sans savoir coder, puisse le tenir à jour**.
Règle d'or à retenir :

> 🟢 **Tout ce qui est du contenu (scores, joueurs, textes, annonces, coordonnées...) se modifie dans les fichiers du dossier `data/` (format `.json`).**
> 🔴 **Le dossier `js/` (le code) et les fichiers `.html` ne doivent normalement plus jamais être touchés**, sauf les deux exceptions listées en bas de ce guide.

Un fichier `.json` s'ouvre avec n'importe quel éditeur de texte simple (Bloc-notes, Notepad++,
VS Code...). Chaque modification est enregistrée, puis republiée sur ton hébergement (GitHub
Pages ou autre) — le site se met à jour automatiquement, sans rien recompiler.

⚠️ **Règle de syntaxe JSON à respecter toujours** : chaque `{ }` ouvert doit être refermé, chaque
élément d'une liste est séparé par une virgule (sauf le dernier), et le texte est toujours entre
guillemets doubles `"..."`. Une virgule oubliée ou en trop empêche tout le fichier de se charger.
**Avant de publier, tu peux coller le contenu du fichier sur jsonlint.com pour vérifier qu'il n'y
a pas de faute.**

---

## 1. Vue d'ensemble des fichiers `data/`

| Fichier | Alimente | Contenu |
|---|---|---|
| `teams.json` | Équipes (accueil, équipes, calendrier...) | Liste des 16 clubs : nom, code, couleurs, blason |
| `joueurs.json` | Fiche équipe (effectif) | Liste des joueurs de chaque club |
| `club-profils.json` | Fiche équipe (historique, palmarès, galerie) | Texte + palmarès + photos + vidéos par club |
| `scores.json` | Calendrier, accueil, fiche équipe | Les 240 matchs de la saison (aller-retour) |
| `standings.json` | Classement, accueil, fiche équipe | Le tableau de classement général |
| `stats.json` | Statistiques, accueil | Buteurs, passeurs, gardiens, cartons, homme du match, affiches à la une |
| `annonces.json` | Annonces, accueil | Tous les communiqués + programme des 2 semaines |
| `competition.json` | Page Compétition | Textes de présentation, format, règlement |
| `contact-info.json` | Page Contact | Coordonnées, réseaux sociaux, FAQ, carte |

---

## 2. Équipes — `teams.json`

```json
{
  "nom": "JS Porte des Cieux",
  "code": "PDC",
  "couleur": "#1e88e5",
  "accent": "#ffffff",
  "id": 1,
  "slug": "js-porte-des-cieux",
  "badge": "images/badges/js-porte-des-cieux.svg"
}
```
- `"nom"` doit être **identique, partout**, dans `scores.json`, `standings.json`, `stats.json`,
  `joueurs.json` (clé) et `club-profils.json` (clé) — sinon le rapprochement automatique échoue
  et l'information n'apparaît pas.
- `"badge"` est le chemin vers le logo de l'équipe (voir section 8 sur les photos).

## 3. Effectif d'une équipe — `joueurs.json`

Un objet par équipe (clé = le `slug` de l'équipe), avec la liste de ses joueurs :

```json
"js-porte-des-cieux": [
  { "numero": 1, "nom": "Jean Mukendi", "poste": "Gardien", "photo": "images/joueurs/mukendi.jpg" }
]
```
Postes possibles : `Gardien`, `Défenseur`, `Milieu`, `Attaquant`.

## 4. Historique et palmarès — `club-profils.json`

Un objet par équipe (même clé `slug`) :

```json
"js-porte-des-cieux": {
  "surnom": "Les Anges de Kipushi",
  "fondation": 1998,
  "stade": "Terrain Porte des Cieux",
  "histoire": "Texte libre, plusieurs phrases...",
  "fait_marquant": "Une phrase qui met en avant un exploit du club.",
  "palmares": [
    { "saison": "2022", "titre": "Vice-champion de l'Entente de Kipushi" }
  ],
  "photos": [ "images/galerie/pdc-1.jpg", "images/galerie/pdc-2.jpg" ],
  "videos": [ "dQw4w9WgXcQ" ]
}
```
- `"videos"` : uniquement l'identifiant YouTube (les 11 caractères après `watch?v=` dans le lien).

## 5. Calendrier et scores — `scores.json`

```json
{
  "id": 25,
  "journee": 4,
  "jour": "Samedi",
  "date": "01 Août 2026",
  "heure": "12h00",
  "domicile": "US Kipushi",
  "exterieur": "FC Biayi",
  "score_domicile": null,
  "score_exterieur": null,
  "statut": "a_venir",
  "jour_numero": 10
}
```
- `"statut"` : `"a_venir"` (score à `null`), `"live"` (en cours), ou `"termine"` (avec les scores).
- Les boutons de filtre "Journée 1, 2, 3..." de la page Calendrier se génèrent **automatiquement**
  à partir des journées présentes dans ce fichier — tu n'as plus jamais besoin de toucher au HTML,
  même si tu ajoutes une 31ᵉ journée.
- Le calendrier actuel couvre déjà les **30 journées complètes de la saison (aller-retour, 240
  matchs)**, générées automatiquement pour que chaque équipe affronte les 15 autres deux fois.

## 6. Classement — `standings.json`

⚠️ **Ce fichier n'est PAS recalculé automatiquement à partir des scores.** Après chaque journée
jouée, tu dois mettre à jour toi-même chaque ligne concernée :

```json
{
  "nom": "Ajax Club",
  "code": "AJX",
  "badge": "images/badges/ajax-club.svg",
  "mj": 2, "v": 2, "n": 0, "d": 0,
  "bp": 5, "bc": 0, "diff": 5,
  "pts": 6,
  "rang": 1
}
```
- `mj/v/n/d` = matchs joués / victoires / nuls / défaites. `bp/bc` = buts pour/contre.
  `pts` = 3 par victoire + 1 par nul. `rang` = position (à retrier toi-même après mise à jour).
- Cette même donnée alimente **à la fois** la page Classement, le mini-classement de l'accueil,
  **et** le badge de position affiché sur chaque fiche équipe — une seule mise à jour suffit.

## 7. Statistiques et vitrine "temps forts" — `stats.json`

Contient les buteurs, passeurs, gardiens, cartons, et deux éléments visuels en carrousel :

**Homme du match** (3 vignettes, affichées sur `statistiques.html` ET sur l'accueil) :
```json
"hommes_du_match": [
  { "jour_numero": 1, "nom": "Nom du joueur", "equipe": "Ajax Club", "photo": "images/MVP1.jpeg" }
]
```

**Affiches à la une** (nouveau — 3 vignettes ajoutées uniquement sur l'accueil, montrant les 2
blasons + le score d'un match) : tu ne donnes pas le score toi-même, tu donnes juste l'`id` du
match dans `scores.json`, et tout (blasons, noms, score, date) est récupéré automatiquement :
```json
"affiches_a_la_une": [
  { "match_id": 1 },
  { "match_id": 5 },
  { "match_id": 11 }
]
```
Pour changer les 3 matchs mis en avant sur l'accueil : ouvre `scores.json`, repère l'`"id"` du
match que tu veux mettre en avant, et remplace le `match_id` correspondant ici. Le carrousel de
l'accueil affiche donc **6 vignettes au total** (3 hommes du match + 3 affiches), qui défilent
automatiquement.

## 8. Annonces — `annonces.json`

Chaque communiqué est un objet dans la liste `"communiques"`. Les plus récents doivent être
placés **en premier** dans la liste (l'ordre du fichier = l'ordre d'affichage).

```json
{
  "type": "resultat",
  "date_pub": "05 Juillet 2026",
  "titre": "Résultats de la Journée 1",
  "texte": "JS Kamatete 3-3 US Kipushi, CS Kamarenge 1-4 JS Porte des Cieux...",
  "matchs": [
    { "domicile": "JS Kamatete", "score_domicile": 3, "score_exterieur": 3, "exterieur": "US Kipushi" }
  ]
}
```
Types possibles : `"resultat"`, `"video"` (ajoute `"youtube_id"`), `"choc"` (match à venir, ajoute
`"domicile"`, `"exterieur"`, `"heure"`, `"lieu"`), `"communique-officiel"`, `"evenement"` (ajoute
`"photos"`, liste de chemins d'images).

Le mini-défilé d'annonces sur la page d'accueil utilise **automatiquement les 6 premières entrées**
de ce même fichier — pas besoin de dupliquer l'information ailleurs.

Le bloc `"programme"` (frise chronologique des 2 prochaines semaines) suit la même logique, avec
`"date"`, `"jour"`, `"mois"`, `"type"` (`reunion`/`formation`/`social`/`solidarite`/`match`),
`"titre"` et `"texte"`.

## 9. Page Compétition — `competition.json`

Textes de présentation, les 4 cartes "Format de la compétition", et la liste des règles. Chaque
règle a une icône FontAwesome (`"icone"`) et éventuellement une couleur (`"couleur"`, sinon `null`).

## 10. Page Contact — `contact-info.json`

Coordonnées, numéro WhatsApp, réseaux sociaux, FAQ (avec `"ouvert_par_defaut": true/false`), et
localisation (lien de la carte OpenStreetMap + lien Google Maps).
Le formulaire lui-même (les champs à remplir) reste géré par le code, car c'est un élément
fonctionnel — mais tous les **textes autour** (titre, coordonnées, FAQ) viennent de ce fichier.

---

## 11. Les photos — comment ça marche

Un fichier JSON ne peut pas contenir une image "à l'intérieur" (ce serait très lourd et casserait
la rapidité du site). À la place, **chaque JSON contient juste le chemin vers l'image**, qui elle
est un vrai fichier dans le dossier `images/`.

Pour changer une photo (logo de club, photo de joueur, photo d'homme du match, photo de galerie...) :

1. Prépare ta nouvelle image (idéalement déjà compressée / pas trop lourde, format `.jpg`, `.jpeg`,
   `.png`, ou `.svg` pour les logos).
2. Dépose le fichier dans le bon sous-dossier de `images/` (ex. `images/joueurs/`, `images/badges/`,
   `images/galerie/`).
3. Deux façons de faire :
   - **Le plus simple** : donne à ta nouvelle image **exactement le même nom** que l'ancienne, et
     remplace le fichier — tu n'as alors rien à changer dans le JSON.
   - **Ou** : donne-lui un nouveau nom, et modifie le chemin `"photo"` / `"badge"` / `"photos"`
     correspondant dans le fichier JSON concerné pour qu'il pointe vers le nouveau nom de fichier.

---

## 12. Ce qui reste volontairement en dehors du système JSON

- **Le formulaire de contact** (les champs à remplir) : c'est un élément interactif, pas du
  contenu à éditer.
- **L'en-tête (logo + menu de navigation) et le pied de page (footer)** : à ta demande, ces deux
  zones restent gérées directement en HTML, identiques sur toutes les pages.

Tout le reste de ce que voit un visiteur — calendrier, classement, fiches équipe, statistiques,
annonces, page compétition, page contact — vient maintenant intégralement des fichiers `data/*.json`.

---

## 13. Bon à savoir si tu délègues un jour la maintenance

Si tu gagnes un contrat et que tu dois faire gérer le site par quelqu'un d'autre (bénévole,
stagiaire, community manager...) :
- Cette personne **n'a besoin d'aucune compétence en programmation**, seulement de savoir éditer
  un fichier texte et respecter la syntaxe JSON (voir l'avertissement tout en haut de ce guide).
- Donne-lui uniquement l'accès au dossier `data/` (et `images/` pour les photos) — elle n'a jamais
  besoin d'ouvrir les dossiers `js/` ou les fichiers `.html`.
- Un bon réflexe à lui apprendre : **toujours faire une copie du fichier JSON avant de le modifier**
  (ex. `scores.json.backup`), pour pouvoir revenir en arrière en cas d'erreur de syntaxe.

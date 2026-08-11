# Mode « Thèmes par équipes »

Le mode « Chrono 3 min » devient **« Thèmes par équipes »** : chaque équipe joue 3 minutes sur un thème précis qu'elle choisit, et on additionne les points sur plusieurs manches.

## 1. Bouton d'accueil

- Renommage du bouton en « Thèmes par équipes ».
- Look presque aussi fort que « Jouer » : fond dégradé multicolore animé (jaune → rose → cyan → violet), même hauteur, texte gras, icône équipes.
- « Jouer » reste le bouton principal, la section lobby reste discrète en dessous.

## 2. Configuration des équipes

Premier écran du mode (sur un seul téléphone qu'on se passe) :
- Choix 2 ou 3 équipes.
- Nom modifiable pour chaque équipe (noms par défaut amusants pré-remplis, couleur par équipe).
- Nombre de manches : 3 par défaut (réglable 1-3).
- Bouton « Commencer ».

## 3. Écran des thèmes

- 6 thèmes tirés au sort parmi une banque de ~120 thèmes très précis (ex. « Footballeurs chauves », « Chanteurs français », « Méchants Disney », « Rappeurs des années 2000 », « Marques de bonbons », « Personnages de Kaamelott »).
- L'équipe dont c'est le tour est mise en avant en haut, avec le score en direct de toutes les équipes et la manche en cours.
- Elle tape un thème → son tour de 3 minutes démarre.
- Après son tour, le thème joué est grisé et non rejouable ; la main passe à l'équipe suivante.
- À chaque nouvelle manche, les 6 thèmes restent ceux du tirage de la partie (grisés au fur et à mesure) ; s'il n'en reste plus assez, un nouveau tirage complète l'écran.

## 4. Tour de jeu

- Même écran chronométré qu'aujourd'hui (mot géant, catégorie, indice, Trouvé / Passer, +1/+2/+3 selon difficulté), mais les mots sont tirés **dans le thème choisi**.
- Fin du tour : récap animé (score qui monte, liste des mots trouvés/passés) puis « Passer la main ».

## 5. Fin de partie

- Après la dernière manche : classement final avec podium, totaux par équipe, animation de félicitations pour le gagnant (confettis + nom animé), gestion des égalités.
- Deux boutons : **« Rejouer avec les mêmes équipes »** (retour à l'écran des thèmes avec 6 nouveaux thèmes tirés au hasard et scores remis à zéro) et **« Retour à l'accueil »**.

## Détails techniques

- Nouveau dossier `src/lib/themes/` : `themes.ts` exporte `THEMES: Theme[]` (`id`, `label`, `emoji`, `words: BankWord[]` avec `hint` et `level`), réparti sur plusieurs fichiers de lots générés en parallèle (~120 thèmes × 14-20 mots). Helpers : `drawThemes(count, excludeIds)` et `pickThemeWord(theme, seen)` (tirage sans répétition dans le tour, avec recyclage si le thème est épuisé).
- Nouvelle route `src/routes/themes.tsx` : machine à états locale (`setup` → `themes` → `playing` → `turnResult` → `final`), scores en mémoire, aucune dépendance backend ni lobby. `head()` dédié (titre/description/og).
- `src/components/chrono/chrono-round.tsx` gagne une prop optionnelle `theme` : quand elle est fournie, les mots viennent du thème au lieu de `pickWord()`; le libellé du thème est affiché en haut. Le comportement actuel (modes existants) reste identique sans la prop.
- Nouveaux composants : `src/components/themes/team-setup.tsx`, `theme-board.tsx` (grille des 6 thèmes, états grisés), `final-standings.tsx` (podium + félicitations animées Framer Motion).
- `src/routes/index.tsx` : bouton multicolore (dégradé via tokens du design system dans `src/styles.css`, pas de couleurs codées en dur) pointant vers `/themes`.
- `src/routes/chrono.tsx` est remplacé par le nouveau flux ; l'ancien mode chrono en lobby (`room.$code_.chrono.tsx`) et les modes front/solo restent inchangés.
- Sons et vibrations existants réutilisés (`sfx.ts`, `haptics.ts`), y compris un son de victoire à l'écran final.

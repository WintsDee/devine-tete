# Thèmes par équipes — plus de mots, chrono 1:30, manches auto

## 1. Fini les mots en boucle
- Les mots déjà sortis (trouvés **et** passés) sont retirés du tirage pour toute la partie, pas seulement pour le tour en cours : une équipe ne peut plus retomber sur un mot déjà joué.
- Si un thème est épuisé (très improbable avec la nouvelle taille), le tour continue avec un message plutôt qu'une répétition.

## 2. Banque de mots par thème nettement élargie
- On passe de ~15 mots par thème à ~40 par thème (≈118 thèmes, soit ~4700 mots au total).
- Les nouveaux mots respectent la même règle : connus du grand public, avec une petite description et un niveau de difficulté 1/2/3 (majorité de niveau 1).

## 3. Chrono de 1 min 30
- Le tour passe de 3 minutes à 1 min 30, y compris les textes affichés (« Choisissez votre thème · 1 min 30 »).
- Les autres modes de jeu ne changent pas.

## 4. Nombre de manches automatique
- 2 équipes → 3 manches (6 tours = les 6 thèmes tirés).
- 3 équipes → 2 manches (6 tours = les 6 thèmes tirés).
- Le sélecteur manuel de manches disparaît de l'écran de configuration ; on affiche simplement le calcul (« 3 manches · 6 thèmes »).

## 5. Icônes des thèmes au style de l'app
- Les emojis sont remplacés par des icônes Lucide dans la palette de l'app : jaune par défaut, avec une rotation multicolore (jaune / rose / cyan / violet / lime) selon la position dans la grille, via les tokens du design system.
- Un thème grisé garde son icône, désaturée.

## Détails techniques
- `src/lib/themes/types.ts` : `emoji` remplacé par `icon` (nom d'icône Lucide) ; mapping nom → composant dans `src/lib/themes/icons.ts`.
- `src/lib/themes/batch1..4.ts` : étendus à ~40 mots par thème (4 lots générés en parallèle), format inchangé (`text`, `category`, `hint`, `level`).
- `src/lib/themes/index.ts` : `pickThemeWord(theme, seen)` renvoie `null` quand le thème est épuisé au lieu de recycler.
- `src/components/chrono/chrono-round.tsx` : nouvelle prop optionnelle `excludeWords`, remontée des mots vus dans `RoundResult`, et mot initial ajouté à `seen`.
- `src/routes/themes.tsx` : `seenWords` global de la partie (remis à zéro sur « Rejouer »), `rounds` calculé depuis le nombre d'équipes, `THEME_SECONDS = 90`.
- `src/components/themes/team-setup.tsx` : suppression du sélecteur de manches, `onStart(teams)` seulement.
- `src/components/themes/theme-board.tsx` : rendu des icônes colorées, texte « 1 min 30 ».
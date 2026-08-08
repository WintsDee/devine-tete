# Afficher la catégorie au-dessus de chaque mot

## Objectif
Ajouter un petit indicateur de catégorie juste au-dessus du mot géant, sur tous les écrans où le mot est visible au joueur qui tient le téléphone. Cela aide à donner des indices (« c'est un personnage de film », « c'est une marque », etc.) si le devineur bloque.

## Fichiers concernés
- `src/routes/play.$code.tsx` : mode lobby (écran "front" noir).
- `src/routes/solo.tsx` : mode rapide (écran "front" noir).
- `src/components/chrono/chrono-round.tsx` : mode Chrono 3 min.

## Détails techniques
- La propriété `category` existe déjà sur `BankWord` (`src/lib/words-types.ts`), donc aucune modification de la structure de données n'est nécessaire.
- Pour chaque écran de mot affiché, insérer un libellé de catégorie entre le compteur / badge du haut et le mot géant.
- Style : texte petit (`text-xs` ou `text-sm`), semi-transparent (`text-muted-foreground`), uppercase avec tracking, centré, court et non intrusif.
- Exemples de wording : "Personnage", "Célébrité", "Objet", "Marque", "Série", "Film", "Sport", "Mème", etc.
- Conserver l'animation existante (Framer Motion) : le libellé de catégorie apparaît en même temps que le mot.
- Pas de changement de logique de jeu, de difficulté ou de son/haptique.

## Affichage spécifique par écran

### Mode lobby (`play.$code.tsx`)
- Phase "front" : entre le texte "Caché dans X s / En pause" et le mot géant, afficher la catégorie centrée.
- Garder le hint existant sous le mot.

### Mode rapide (`solo.tsx`)
- Phase "front" : même chose que le mode lobby.
- Même structure avec hint sous le mot.

### Mode Chrono (`chrono-round.tsx`)
- Afficher la catégorie au-dessus du badge de points/difficulté, ou juste au-dessus du mot. Garder le badge existant et le hint sous le mot.
- Reste lisible sur petit écran : ne pas empiler trop d'éléments verticalement.

## Vérification
- Visuellement, la catégorie est lisible au-dessus du mot dans chacun des trois modes.
- Le build et la typecheck passent.
- Pas de régression sur les animations, le compte à rebours ou le hold/pause.

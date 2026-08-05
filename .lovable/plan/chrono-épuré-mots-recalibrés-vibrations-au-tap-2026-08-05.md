# Chrono épuré, mots recalibrés, vibrations au tap

## 1. Écran Chrono plus épuré
Supprimer le paragraphe explicatif au-dessus du bouton « Démarrer » sur l'écran Chrono (`src/routes/chrono.tsx`), ainsi que le texte équivalent au-dessus du bouton de lancement côté lobby s'il en existe un. Il ne reste que le titre et le gros bouton.

## 2. Recalibrage complet de la banque de mots
Aujourd'hui la difficulté est *devinée* automatiquement (longueur du nom, rareté de la catégorie), d'où des mots faciles notés difficiles et l'inverse.

Changements :
- Chaque mot porte désormais une difficulté écrite à la main : `1` (tout le monde connaît), `2` (connu mais moins évident), `3` (connu mais dur à faire deviner).
- Passe de relecture sur les ~2000 entrées (parties 1 à 5) :
  - suppression des mots trop niches (connus seulement d'une communauté : mèmes obscurs, petits streamers, séries confidentielles, références trop pointues) ;
  - correction des descriptions fausses ou approximatives (âges, dates, œuvre d'origine, vivant/mort) ;
  - attribution d'une difficulté cohérente avec la notoriété réelle.
- Règle de tirage : la majorité des mots qui sortent sont faciles — environ 70 % de niveau 1, 22 % de niveau 2, 8 % de niveau 3. Les points restent 1, 2 ou 3 selon ce niveau, et le badge affiché (« Facile / Corsé / Difficile ») suit la difficulté écrite à la main.

La banque reste large (anti-répétition conservé), mais un peu plus courte après le nettoyage des mots niches.

## 3. Vibrations douces au clic
Ajouter un retour haptique léger (~10 ms) sur les boutons : nouveau motif `tap` dans `src/lib/haptics.ts`, câblé dans le composant `Button` partagé et sur les gros boutons personnalisés (Démarrer, Trouvé, Passer, boutons d'accueil). Respecte le réglage haptique existant (désactivable) et reste sans effet là où l'API n'existe pas.

## Détails techniques
- `src/lib/words-types.ts` : ajout de `level: 1 | 2 | 3` à `BankWord`.
- `src/lib/difficulty.ts` : `wordValue()` renvoie le `level` du mot au lieu de l'heuristique ; `VALUE_LABEL` inchangé.
- `src/lib/game.ts` : tirage pondéré par niveau (70/22/8), suivi `dt.seenWords` conservé.
- `src/lib/words/part1..5.ts` : réécriture des entrées (niveau + hints corrigés, suppression des niches), traitée par lots pour rester fiable.
- `src/lib/haptics.ts` + `src/components/ui/button.tsx` : motif `tap` et déclenchement au clic.
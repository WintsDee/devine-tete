# Mode « Thèmes par équipes » : 3 ajustements

## 1. Décompte de 5 secondes avant le premier mot

Après le choix du thème, un écran plein écran affiche « 5 · 4 · 3 · 2 · 1 » en gros chiffres animés (avec bip léger et vibration à chaque seconde), puis le premier mot apparaît et le chrono de 1 min 30 démarre seulement à ce moment-là. L'équipe a ainsi le temps de se mettre en place.

## 2. Un joker par équipe pour changer un thème

- Chaque équipe démarre la partie avec 1 joker.
- Sur l'écran des thèmes, l'équipe dont c'est le tour voit un bouton « Joker · changer un thème » (désactivé si déjà utilisé).
- En l'activant, on choisit lequel des 6 thèmes remplacer : il est aussitôt remplacé par un thème inédit, le joker est consommé (badge « joker utilisé »).
- Les jokers ne se rechargent pas entre les manches ; ils sont remis à 1 seulement quand on relance une nouvelle partie (« Rejouer »).
- Le compteur de jokers restants est visible dans la liste des scores.

## 3. Ne plus revoir les mêmes thèmes en rejouant

La banque contient ~119 thèmes. Aujourd'hui chaque « Rejouer » tire au sort sans mémoire des parties précédentes, d'où les répétitions. On mémorise la liste des thèmes déjà vus depuis le début de la session (toutes les parties, tous les remplacements par joker et tous les tirages de complément), et les tirages piochent uniquement dans les thèmes jamais vus. Une fois les ~119 thèmes épuisés, on remet le compteur à zéro et on repart sur un cycle complet. Résultat : 15 à 20 parties consécutives sans aucun thème répété.

## Détails techniques

- `src/routes/themes.tsx` : nouvel état `phase: "countdown"` entre `board` et `playing` ; `seenThemeIds` (mémoire de session, cumulée par-dessus `usedIds`) passé en `excludeIds` à chaque `drawThemes` ; `jokers: number` ajouté à `TeamState`, remis à 1 dans `startGame` et `replay`.
- Nouveau composant `src/components/themes/start-countdown.tsx` : décompte 5 s animé (Framer Motion), `tickSound()` + `vibrate("tap")` par seconde, callback `onDone`.
- `src/components/themes/theme-board.tsx` : bouton joker, mode « sélection du thème à remplacer » (les cartes non jouées deviennent cliquables pour le remplacement, annulation possible), affichage des jokers restants par équipe.
- `src/lib/themes/index.ts` : `drawThemes` conserve son repli actuel ; ajout d'un helper `drawOneTheme(excludeIds)` pour le remplacement joker.
- Aucun changement de banque de mots, ni de backend.

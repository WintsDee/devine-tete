# Fiabiliser les mots + une seule grande banque pour le mode solo

## Objectifs
1. Corriger les descriptions fausses ou vides de sens sur l'ensemble des mots (mode solo, mode par équipes).
2. Recalibrer strictement la difficulté : +2 et +3 réservés aux mots réellement durs à faire deviner.
3. Rendre les mots du mode par équipes disponibles au mode solo (~7000 mots au total).

## Ce qui existe aujourd'hui
- Mode solo : banque `src/lib/words/part1..part5` (~1950 mots), fusionnée dans `src/lib/words.ts`.
- Mode par équipes : ~120 thèmes dans `src/lib/themes/batch1..4`, enrichis par `extra-a..f` (~4800 mots).
- Difficulté : champ `level` écrit à la main dans chaque entrée, converti en points par `src/lib/difficulty.ts`.

## Problèmes constatés dans les fichiers
- Les packs `extra-*` contiennent des descriptions purement mécaniques et sans valeur de jeu ("Vivant, né en 1972") au lieu d'un vrai indice.
- La déduplication est sensible aux accents : "Zinédine Zidane" et "Zinedine Zidane" coexistent donc dans le même thème.
- Les niveaux 2 et 3 sont attribués de façon inégale entre les lots (des noms très connus notés 2, des mots obscurs notés 1).

## Plan d'exécution

### 1. Banque solo unifiée (~7000 mots)
- `src/lib/words.ts` fusionne la banque solo existante ET tous les mots de tous les thèmes.
- Déduplication normalisée : minuscules + suppression des accents + espaces réduits, pour éliminer les doublons actuels.
- La catégorie affichée au-dessus du mot en jeu reste celle du thème (utile comme indice), le tirage anti-répétition via `localStorage` continue de fonctionner.
- Le mode par équipes garde ses thèmes intacts (aucun changement de gameplay).

### 2. Relecture des descriptions
Passage par lots sur tous les fichiers de mots, avec des règles fixes :
- 1 phrase, ~60-90 caractères, sans jamais contenir le mot lui-même.
- Personne réelle : ce pour quoi elle est connue + vivant/mort (et l'âge si vivant).
- Personnage fictif : œuvre d'origine + trait marquant + mention "fictif".
- Objet / concept / lieu : ce que c'est + le repère culturel qui le rend connu.
- Correction des erreurs factuelles (dates, nationalités, œuvres, statut vivant/mort), réécriture complète des indices creux des packs `extra-*`.

### 3. Recalibrage de la difficulté
Règle appliquée uniformément :
- **Niveau 1 (~80%)** : tout le monde connaît et devine vite.
- **Niveau 2 (~15%)** : connu de presque tous mais dur à faire deviner sans le nommer.
- **Niveau 3 (~5%)** : connu mais vraiment coriace (concept abstrait, personnage secondaire célèbre).
- Tout mot trop niche est soit remonté en clarté, soit supprimé plutôt que classé 3.
- Les bonus de score du mode par équipes bénéficient automatiquement du recalibrage.

### 4. Vérifications finales
- Contrôle automatique : aucun doublon après normalisation, `hint` présent partout, longueur raisonnable, répartition des niveaux conforme aux cibles.
- Comptage final des mots disponibles en solo (objectif ~7000).
- Test en aperçu des trois modes (solo, affichage front, thèmes par équipes).

## Notes techniques
- La relecture est découpée en lots parallèles fichier par fichier pour rester fiable sur ce volume.
- Aucun changement de schéma : `BankWord { text, category, hint, level }` reste identique.
- Aucune modification base de données : les mots sont locaux.

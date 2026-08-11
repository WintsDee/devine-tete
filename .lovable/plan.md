# Relecture des descriptions et recalibrage de la difficulté

Environ 6 900 entrées existent aujourd'hui : ~1 950 pour les modes Jouer / Solo (`src/lib/words/part1..5`) et ~4 950 pour le mode Thèmes par équipes (`src/lib/themes/*`). Les niveaux 2 et 3 représentent aujourd'hui plus de 30 % de la banque, ce qui est bien trop généreux.

## 1. Vérification de toutes les descriptions
Passe de relecture sur chaque entrée, avec correction :
- personnes réelles : âge ou année de naissance juste, vivant/mort à jour, ce qui les rend célèbres réellement exact ;
- personnages de fiction : bonne œuvre d'origine, bon rôle ;
- objets, lieux, concepts, événements : bonne époque, bon repère culturel ;
- suppression des mentions floues ou non vérifiables, description ramenée à une ligne claire (~85 caractères).

Les entrées dont l'identité est ambiguë ou trop niche sont supprimées plutôt que devinées.

## 2. Recalibrage strict des +2 et +3
Nouvelles règles appliquées à toutes les entrées :
- **niveau 1 (+1)** : mot que tout le monde connaît et fait deviner facilement — la grande majorité (environ 80 %) ;
- **niveau 2 (+2)** : connu de presque tout le monde mais réellement pénible à faire deviner (concept abstrait, nom qu'on n'a pas en tête spontanément) — environ 15 % ;
- **niveau 3 (+3)** : rare, réservé aux mots que tout le monde reconnaît mais qui sont vraiment très durs à faire deviner (abstraction pure, aucune image évidente) — environ 5 %, jamais un mot niche.

Tout mot actuellement en 2 ou 3 uniquement parce qu'il est peu connu redescend en 1 ou est supprimé.

## 3. Cohérence de l'affichage
Les badges « Facile / Corsé / Difficile » et les points suivent directement le niveau corrigé ; aucune heuristique n'est réintroduite.

## Détails techniques
- Relecture par lots parallèles, un agent par fichier : `src/lib/words/part1.ts`, `part1b.ts`, `part2.ts`, `part3.ts`, `part4.ts`, `part5.ts`, puis `src/lib/themes/batch1..4.ts` et `extra-a..f.ts`. Chaque agent ne modifie que `hint` et `level`, garde le format et les clés `text` / `category` (sauf suppression d'entrées fausses).
- Après fusion : vérification du typage, comptage des niveaux pour valider la répartition 80/15/5, et contrôle qu'aucun thème ne descend sous ~35 mots après suppressions.
- Aucun changement d'écran ni de logique de jeu : `src/lib/difficulty.ts`, `src/lib/themes/index.ts` et les composants restent inchangés.
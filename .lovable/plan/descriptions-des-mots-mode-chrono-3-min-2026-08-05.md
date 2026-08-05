# Descriptions des mots + mode « Chrono 3 min »

## 1. Une petite description sous chaque mot

Chaque entrée de la banque gagne un champ `hint` court (une ligne) :
- Personnes/personnages : âge ou année de naissance, vivant ou mort, ce qui les rend célèbres.
  Ex. « Zinédine Zidane — 54 ans, vivant, footballeur, coup de boule 2006 ».
- Objets/concepts : époque et repère culturel. Ex. « Tamagotchi — jouet virtuel des années 90-2000 ».

Affichage : en petit, sous le mot géant, **uniquement sur l'écran de celui qui montre le téléphone**. Le devineur ne la voit jamais.

## 2. Nettoyage de la difficulté

Passage complet des 2000 entrées : on retire les références de niche (personnages secondaires, refs très pointues) et on les remplace par du grand public, en gardant une petite part de mots « piquants » mais reconnaissables. La taille de la banque reste autour de 2000, toujours sans répétition.

## 3. Nouveau mode « Chrono 3 min » (solo / 2 joueurs)

Bouton dédié sur l'accueil, sous « Jouer (sans lobby) ».

Déroulé :
- Un joueur tient le téléphone et lit le mot (avec sa description), l'autre devine.
- Pas de compte à rebours d'affichage, pas de masquage : le mot reste visible.
- Minuteur global de 3 minutes affiché en haut.
- Deux gros boutons : **Trouvé** (+1 point, son/vibration de réussite, mot suivant) et **Passer** (mot suivant, sans point).
- À la fin : écran de score animé (compteur qui monte, confettis, liste des mots trouvés/passés avec leur description), boutons « Rejouer » et « Retour ».

## 4. Chrono en équipes dans le lobby

- Dans le lobby, une section « Équipes » : les joueurs présents sont répartis en équipes (2 joueurs ou plus), création/renommage d'équipe et rejoindre une équipe en un tap.
- L'hôte choisit le nombre de manches (1 à 3) et lance la partie.
- Chaque équipe joue 3 minutes à son tour, sur le téléphone de l'équipe active ; les autres voient un écran d'attente avec le classement en direct.
- Après la dernière manche : classement final animé (podium, totaux par équipe, meilleure manche).
- Synchronisation temps réel : tout le monde voit les scores et la progression des manches.

## Détails techniques

- `src/lib/words-types.ts` : `BankWord` gagne `hint: string`. Les quatre fichiers `src/lib/words/part1..4.ts` sont régénérés avec `hint` et la difficulté ajustée (agents en parallèle, un lot par fichier), puis dédupliqués dans `src/lib/words.ts`.
- `src/lib/game.ts` : `pickWord()` renvoie l'entrée complète (`text` + `hint`) au lieu du seul texte ; `drawWord`/`setPlayerWord` inchangés côté base.
- Nouvelle route `src/routes/chrono.tsx` : mode 3 min hors lobby, avec `head()` propre, minuteur, score, écran final animé (Framer Motion), sons existants de `src/lib/sfx.ts` et vibrations de `src/lib/haptics.ts`.
- Composants partagés extraits dans `src/components/chrono/` (minuteur, carte mot+description, écran de score) pour être réutilisés par le mode lobby.
- Backend : nouvelles tables `teams` (room_id, name), `team_members` (team_id, player_id), `chrono_games` (room_id, rounds, current_round, current_team_id, status, turn_ends_at) et `chrono_scores` (game_id, team_id, round, points), avec GRANT + RLS ouverts comme les tables existantes, et Realtime activé.
- Nouvelle route `src/routes/room.$code.chrono.tsx` : écran de tour en équipe (jeu, attente, classement) branché sur Realtime.
- `src/routes/index.tsx` : ajout du bouton « Chrono 3 min » ; `src/routes/room.$code.tsx` : section équipes + lancement du mode.
- Les modes existants (front + masquage 10 s) restent inchangés.

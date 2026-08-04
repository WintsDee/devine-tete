# Sons élégants, mots plus retors, et mots soufflés par un voisin

## 1. Design sonore et haptique

Remplacer le bip carré actuel par une petite bibliothèque de sons synthétisés (Web Audio, aucun fichier à télécharger) :

- **Tic du décompte** : note courte et douce (sinus + léger filtre), plus grave à 5 puis montant jusqu'à 1.
- **Révélation du mot** : arpège de trois notes (accord majeur) avec fondu, quand le mot s'affiche sur le front.
- **Mot reçu d'un voisin** : deux notes rapides, plus cristallines, pour distinguer l'arrivée d'un mot soufflé.
- **Fin de tour** : note descendante discrète.

Vibrations assorties, courtes et rythmées : pulsation légère à chaque tic, motif triple à la révélation, double pulsation à l'arrivée d'un mot soufflé.

Un bouton discret permet de couper le son (préférence mémorisée sur l'appareil) ; les vibrations restent liées à ce réglage.

## 2. Nouvelle banque de mots

Remplacement complet du contenu actuel par environ 90 entrées « connues mais difficiles à faire deviner » : œuvres, événements, concepts et figures que tout le monde a déjà croisés sans y penser spontanément.

Exemples de la tonalité visée :
- Œuvres et lieux : Le Radeau de la Méduse, Le Baiser de Klimt, Le Penseur, Le Mont-Saint-Michel, Le Concorde
- Figures : Grigori Raspoutine, Rosa Luxemburg, Nosferatu, Marie-Antoinette, Alan Turing, Le Marquis de Sade
- Concepts : Le paradoxe de Fermi, L'effet papillon, Le complexe d'Œdipe, La main invisible, L'effet Streisand
- Événements et objets : La Nuit de Cristal, Le naufrage du Titanic, Le rideau de fer, La machine à vapeur

Les mots trop simples (un boomerang, un accordéon, Barack Obama…) sont retirés. Catégories conservées et affinées : Personnage Réel, Personnage Fictif, Œuvre & Lieu, Concept, Événement.

## 3. Un voisin souffle un mot

Depuis la salle d'attente, on touche un joueur de la liste et on lui envoie un mot de son choix.

- Le joueur ciblé reçoit le mot **en direct** sur son écran de jeu : petite bannière « Chloé te souffle un mot », son + vibration, puis un bouton pour lancer le décompte de 5 s avec ce mot.
- S'il est encore dans le lobby, une notification l'invite à ouvrir son tour ; le mot l'attend.
- L'auteur voit une confirmation, et le mot est marqué comme utilisé une fois joué (il peut en envoyer un autre).
- Le joueur ciblé peut refuser et tirer un mot aléatoire à la place.
- Un mot soufflé non utilisé expire au bout de 10 minutes.

## Détails techniques

- **Base de données** : nouvelle table `word_suggestions` (`room_id`, `target_player_id`, `author_player_id`, `author_name`, `text`, `status` pending/used/skipped, `created_at`), accès anonyme en lecture/écriture comme les autres tables du jeu, et ajout à la publication Realtime. Remplacement du contenu de `words` par un jeu de données de ~90 entrées.
- **Audio** : nouveau module `src/lib/sfx.ts` (un seul `AudioContext` réutilisé, débloqué au premier geste utilisateur, enveloppes ADSR courtes) + `src/lib/haptics.ts`. `beep()` dans `src/lib/game.ts` est remplacé par ces appels.
- **Écrans** : `room.$code.tsx` gagne une feuille de saisie « Souffler un mot » par joueur ; `play.$code.tsx` s'abonne aux suggestions le concernant (canal Realtime filtré sur `target_player_id`) et gère l'acceptation/refus. Fonctions `sendSuggestion`, `usePendingSuggestion`, `consumeSuggestion` ajoutées à `src/lib/game.ts`.

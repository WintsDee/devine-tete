# Guess That Word!

Crée une Progressive Web App (PWA) mobile-first et responsive pour un jeu de soirée style "Devine Tête" (Heads Up). 

### 1. Stack Technique & Configuration PWA

- React + Tailwind CSS + Lucide Icons + Framer Motion.

- Base de données Supabase (Lovable Cloud) avec Realtime activé pour la synchronisation multi-joueurs.

- Configuration PWA complète : `manifest.json` avec icônes, meta tags mobile (fullscreen, viewport non-scalable) et Service Worker pour rendre l'application installable sur iOS et Android.

- Génération de QR Code avec la bibliothèque `qrcode.react`.

---

### 2. Base de Données (Supabase)

#### Table `words`

- `id` (uuid, PK)

- `text` (string)

- `category` (string: "Personnage Réel", "Personnage Fictif", "Mot Difficile")

- **Données de départ (Seed DB) :** Insère au moins 60 mots/personnes très difficiles à deviner, en privilégiant des célébrités et personnages réels ou fictifs connus mais précis (ex: "Albert Einstein", "Sherlock Holmes", "Cléopâtre", "Darth Vader", "Marie Curie", "Kylian Mbappé", "Gandalf", "Ollivander", "Barack Obama", "Léonard de Vinci", etc.).

#### Table `rooms`

- `id` (uuid, PK)

- `code` (string, 4 lettres majuscules uniques, ex: "X7K2")

- `created_at` (timestamp)

#### Table `players`

- `id` (uuid, PK)

- `room_id` (fk rooms)

- `name` (string)

- `current_word` (string, nullable)

- `created_at` (timestamp)

---

### 3. Parcours Utilisateur & Écrans

#### Écran 1 : Accueil

- Choix clair entre 2 boutons principaux : "Créer une partie" ou "Rejoindre une partie".

- Champ pour saisir son Pseudo.

- Si "Rejoindre" : champ de texte pour taper le code à 4 lettres + scanner de QR code si possible (ou redirection via URL `?room=CODE`).

#### Écran 2 : Lobby / Salle d'attente

- Affiche le Code de la partie en GROS avec un bouton "Copier le code".

- Affiche le QR Code scannable pour rejoindre directement la partie.

- Liste en temps réel des joueurs présents dans la salle (Supabase Realtime).

- Bouton "Lancer mon tour" pour passer à l'écran de jeu.

#### Écran 3 : Interface de Jeu (Le Tour du Joueur)

- **État Initial :** Un gros bouton central bien visible "Obtenir un mot".

- **Action "Obtenir un mot" :**

  1. Tire un mot aléatoire dans la base `words`.

  2. Enregistre le mot sur la fiche du joueur dans Supabase.

  3. Déclenche un **compte à rebours de 5 secondes** affiché en grand ("5... 4... 3..."). Un signal sonore bip ou une vibration signale la fin du décompte pour avertir les autres joueurs.

  4. Dès la fin du décompte, l'écran passe en **MODE AFFICHAGE FRONT**.

---

### 4. Spécifications du Mode "Affichage Front"

- L'écran passe en plein écran, fond noir pur (`#000000`), avec le mot écrit en **TRÈS GROS, GRAS et couleur JAUNE CANARD ou BLANC ÉTINCELANT** (contraste maximal pour être vu à 3 mètres de distance).

- Gestion du sens de l'affichage (texte adapté aux écrans mobiles en portrait ou paysage).

- **Contrôles discrets au bas de l'écran (pour ne pas perturber la lecture) :**

  - **Bouton "Relancer le décompte" :** Relance le compte à rebours de 5 secondes sans changer le mot (si les autres joueurs n'ont pas eu le temps de le lire).

  - **Bouton "Nouveau mot" :** Tire un tout nouveau mot et relance le décompte.

  - **Bouton "J'ai deviné / Fin du tour" :** Réinitialise l'écran et permet de repasser le téléphone au joueur suivant.

---

### 5. UX & Design

- Style sombre ("Dark Party Theme"), épuré, dynamique avec animations fluides pour le compte à rebours.

- Empêcher la mise en veille de l'écran pendant le tour si possible (Wake Lock API).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://devine-tete.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4f42085c-a243-4bd9-b3e8-fa1b92554119).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

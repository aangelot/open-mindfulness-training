# Architecture — Open Mindfulness Training (application mobile)

> Mise à jour : 16 novembre 2026. Socle et volet Livre en place.

## 1. Objectifs et contraintes

| Contrainte | Conséquence technique |
|---|---|
| Android d'abord (Play Store), iOS ensuite | Framework multiplateforme, une seule base de code |
| Open source (code MIT, contenu CC BY-NC-SA) | Briques open source, aucun service propriétaire indispensable |
| Méditations guidées et minuteur à gongs | Lecture audio en arrière-plan, écran verrouillé, contrôles sur l'écran de verrouillage |
| Carnet d'entraînement quotidien | Saisie rapide, hors-ligne, aucune perte de données |
| Compte **optionnel** | L'app est complète sans compte ; le compte sert à sauvegarder et synchroniser |
| Contenu = openmindfulness.net (WordPress) | Import automatisé, pas de ressaisie |
| Charte du site | Bleus `#4092df` (accent), `#1e73be` (liens), `#27a9e1` (titres), `#edfbff` (panneaux) ; police **Open Sans** |

## 2. Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Expo SDK 58** (React Native 0.88) + TypeScript, *development builds* (`expo-dev-client`) | Android et iOS avec le même code, large vivier de contributeurs, builds Play Store via EAS ou Gradle local |
| Navigation | **Expo Router**, onglets natifs (`NativeTabs`) | Routes par fichiers, liens profonds (`omt://livre/<id>`) |
| Stockage local | **expo-sqlite + Drizzle ORM** | Local-first, migrations typées générées |
| Backend | **Supabase auto-hébergé (OVH)** : Postgres + Auth + Row Level Security | Open source ; facultatif à l'exécution (sans configuration, l'app reste 100 % locale) |
| Audio | **expo-audio** derrière l'interface `AudioEngine` | Module officiel Expo : lecture en arrière-plan, notification média, écran de verrouillage, playlists |
| Polices | Open Sans embarquée au build (plugin `expo-font`) | Pas de chargement au démarrage |
| i18n | **i18next**, textes UI dans `src/core/i18n/fr.json` | Traduction possible plus tard sans refonte |
| Qualité | TypeScript strict, ESLint (`eslint-config-expo`), Jest (`jest-expo`), `expo-doctor`, CI GitHub Actions | |

Alternatives écartées : **Flutter** (Dart réduit le vivier de contributeurs ; les outils de contenu seraient dans un autre langage) et **react-native-track-player** (expo-audio couvre désormais l'arrière-plan et l'écran de verrouillage : une dépendance tierce de moins).

## 3. Vue d'ensemble

```
┌──────────────────────── App Expo (Android / iOS) ────────────────────────┐
│  Onglets : Accueil · Carnet · Méditations · Livre · Profil   (+ Rêves v2)│
│                                                                          │
│  features/carnet   features/meditations   features/book   features/auth  │
│        │                   │                    │                │       │
│  ┌─────▼──────┐     ┌──────▼──────┐     ┌───────▼───────┐   ┌────▼─────┐ │
│  │ SQLite     │     │ AudioEngine │     │ book.json     │   │ Supabase │ │
│  │ (Drizzle)  │     │ (expo-audio)│     │ (embarqué)    │   │ (option) │ │
│  └─────┬──────┘     └──────┬──────┘     └───────────────┘   └────┬─────┘ │
└────────┼───────────────────┼─────────────────────────────────────┼───────┘
         │ sync si connecté  │ streaming / cache MP3               │
         ▼                   ▼                                     ▼
   Supabase OVH         openmindfulness.net/wp-content/uploads   Supabase Auth
   (RLS par utilisateur)

   Outil hors app :  npm run content:import  ──REST──►  openmindfulness.net/wp-json
                             └─► src/content/generated/book.json (commité)
```

## 4. Arborescence

```
OMT_app/
├── src/
│   ├── app/                        # Routes Expo Router (écrans minces)
│   │   ├── _layout.tsx             # Providers : thème, i18n, base locale (migrations)
│   │   └── (tabs)/
│   │       ├── _layout.tsx         # Onglets natifs
│   │       ├── index.tsx           # Accueil
│   │       ├── carnet/             # Pile de navigation du carnet
│   │       ├── meditations/
│   │       ├── livre/              # index (table des matières), [id] (lecture)
│   │       └── profil.tsx
│   ├── core/
│   │   ├── audio/types.ts          # Interface AudioEngine (implémentation au volet Méditations)
│   │   ├── db/                     # schema.ts, client.ts, provider.tsx
│   │   ├── supabase/client.ts      # null si non configuré
│   │   ├── theme/                  # Tokens de la charte + useTheme
│   │   └── i18n/                   # fr.json
│   ├── features/
│   │   ├── carnet/program.ts       # Les 8 semaines sous forme de données (+ tests)
│   │   ├── book/                   # types, accès au contenu, rendu
│   │   ├── meditations/            # (volet 2)
│   │   └── dreams/                 # (v2)
│   ├── content/generated/book.json # Produit par l'import : ne pas éditer à la main
│   └── ui/                         # Text, Screen, Card…
├── drizzle/                        # Migrations SQLite générées (npm run db:generate)
├── supabase/migrations/            # Schéma serveur + RLS
├── scripts/content-import/         # Import WordPress → JSON (+ tests)
├── assets/                         # Icônes, splash, sons (gongs)
└── docs/
```

Règles :
- `src/app/` relie les routes aux écrans, la logique vit dans `src/features/*`.
- Une feature peut dépendre de `src/core` et `src/ui`, pas d'une autre feature. Pour partager, on remonte le code dans `core`.
- Les dossiers `android/` et `ios/` sont générés (`expo prebuild`) et ignorés par git : la configuration native passe par `app.json`.

## 5. Les quatre volets

### 5.1 Carnet d'entraînement
- Le programme est une **donnée** : [src/features/carnet/program.ts](../src/features/carnet/program.ts) (pratique assise type, références P, durées, rappels par catégorie, échelle A–E). Les `id` des rappels sont stables : les évaluations y sont rattachées.
- Un **cycle** a une date de début ; le jour J (0–55) et la semaine en découlent.
- Tables : `training_cycles`, `daily_reports`, `reminder_ratings`, `reminder_notes`.

### 5.2 Méditations
- Catalogue généré depuis `book.json` : chaque pratique P avec un audio.
- Pratiques types des 8 étapes : nouveaux audios fournis par l'équipe.
- Méditation libre : la session est une **file audio** (gong → silence → gong…) jouée par expo-audio, ce qui la garde exacte écran verrouillé, là où Android suspend les minuteurs JavaScript.
- Chaque séance terminée est enregistrée dans `meditation_sessions`, qui alimentera les statistiques.

### 5.3 Livre
- `npm run content:import` lit l'API REST WordPress (articles, catégories, page « Table des matières »), supprime les shortcodes WPBakery et produit des blocs structurés (titres, paragraphes avec gras/italique/liens, listes) + URL audio et PDF.
- Résultat actuel : **148 sections, 13 parties, 136 audios**, environ 730 Ko.
- Écrans : sommaire à parties dépliables (badges E/P, icône audio, coche « lue »), recherche plein texte (insensible aux accents, titres d'abord), lecture avec lecteur audio intégré et boutons section précédente / suivante.
- Progression : table `book_progress` (une ligne par section ouverte, `read_at` posé quand on atteint la fin du texte). Elle alimente « Reprendre la lecture » (sommaire et accueil) et sera synchronisée comme les autres tables.
- Particularités du site dont l'import tient compte :
  - Certains articles sont mal rangés : « 26.ETAPE 6-Pratique type » est dans la catégorie Étape 5, et la table des matières pointe vers lui pour les étapes 4 et 5.
  - La table des matières lie certaines pages deux fois sous deux titres différents. Ces titres-là sont ignorés.
  - Le titre d'une section vient, dans l'ordre : d'un titre généré (pratique type, intro d'étape), de la table des matières, du premier sous-titre de la page, du titre WordPress.

### 5.4 Journal de rêves (v2)
Une table de plus, synchronisée comme les autres.

## 6. Données et synchronisation

- **Local-first** : toutes les écritures vont dans SQLite. Sans compte, rien ne quitte l'appareil.
- Chaque table synchronisée a : `id` UUID généré côté client, `user_id` (vide tant qu'il n'y a pas de compte), `updated_at`, `deleted_at` (suppression logique), `dirty` (modification locale non envoyée).
- À la création d'un compte, les lignes locales reçoivent le `user_id` et sont envoyées.
- Sync push puis pull (ouverture, retour au premier plan, après saisie) ; conflits en *last-write-wins* par ligne.
- Serveur : [supabase/migrations/0001_init.sql](../supabase/migrations/0001_init.sql), chaque table protégée par `user_id = auth.uid()`.

### Supabase auto-hébergé sur OVH
- Déploiement Docker Compose officiel de Supabase sur un VPS, derrière un reverse proxy HTTPS.
- L'app ne connaît que `EXPO_PUBLIC_SUPABASE_URL` et la clé *anon* (publique par conception, la sécurité repose sur la RLS). Voir `.env.example`.
- À prévoir : sauvegardes Postgres, envoi des e-mails d'authentification (SMTP), suppression de compte (obligatoire pour le Play Store).

## 7. Audio
- `AudioEngine` ([src/core/audio/types.ts](../src/core/audio/types.ts)) : `play(queue)`, `pause`, `resume`, `seekTo`, `stop`, `subscribe`.
- Lecteur d'une piste : [src/core/audio/player-bar.tsx](../src/core/audio/player-bar.tsx) (lecture/pause, ±10 s, barre de progression), réutilisé par le volet Méditations.

### Pack audio hors connexion
Le site sert des MP3 320 kbps stéréo (1,37 Go pour 136 fichiers, environ 9 h 30). Pour de la voix, c'est inutile :
- `npm run audio:build` télécharge les originaux, les réencode en **AAC 48 kbps mono** (environ 6 fois plus léger) et écrit le manifeste `src/content/generated/audio.json` (fichier, taille, durée par URL d'origine).
- Les fichiers sont publiés comme pièces jointes de la release GitHub `audio-vN` du dépôt (`npm run audio:build -- --upload`, nécessite `gh`). Changer les fichiers impose d'incrémenter la release : l'app supprime alors les fichiers de l'ancienne.
- Dans l'app ([src/core/audio/offline.ts](../src/core/audio/offline.ts)) : rien n'est téléchargé sans accord. L'accueil propose le téléchargement, le Profil affiche la progression (pause, reprise, suppression). Un téléchargement interrompu reprend au lancement suivant ; chaque fichier est vérifié par sa taille.
- Ordre de lecture d'un audio : copie locale, sinon version légère en streaming depuis la release, sinon (erreur) le fichier original du site.
- Gongs embarqués dans `assets/sounds/`.
- Android : service de premier plan + contrôles média (plugin `expo-audio`, `enableBackgroundPlayback`). Sans contrôles d'écran de verrouillage actifs, Android coupe l'audio après environ 3 min en arrière-plan.

## 8. Build et publication
- Développement : `npx expo run:android` (Android Studio requis) ou `eas build --profile development`.
- Play Store : `eas build --profile production` → AAB. Il faut un compte développeur Google Play (25 $ une fois) et un compte Expo (gratuit).
- Identifiant de l'application : `net.openmindfulness.app`, définitif une fois publié.

## 9. Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 0 — Socle | Expo, thème, onglets, SQLite, i18n, CI, import du contenu | ✅ |
| 1 | Livre (sommaire, lecture, recherche, progression, audio, pack hors connexion) | ✅ |
| 2 | Méditations (catalogue, lecteur, minuteur libre, pratiques types) | |
| 3 | Carnet (cycles, saisie quotidienne, rappels A–E) | |
| 4 | Comptes + synchronisation (Supabase OVH) | |
| v2 | Journal de rêves, notifications, statistiques, pages du site (en savoir plus, dons), iOS | |

## 10. Décisions

| Sujet | Décision |
|---|---|
| Licence du code | MIT |
| Licence du contenu | CC BY-NC-SA 4.0, **provisoire** (confirmation des auteurs à obtenir) |
| Backend | Supabase auto-hébergé sur OVH (compte à créer) |
| Compte | Optionnel |
| Google Play | Compte développeur à créer |
| Audios hors connexion | Réencodage AAC 48 kbps mono, hébergé sur une release GitHub, téléchargé en entier après accord de l'utilisateur |
| Livre v1 | Parties dépliables, lecteur dans la page, précédent/suivant, reprendre + sections lues, recherche plein texte. Pas de réglage de taille de texte pour l'instant |

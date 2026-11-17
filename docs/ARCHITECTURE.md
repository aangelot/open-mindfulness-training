# Architecture — Open Mindfulness Training (application mobile)

> Mise à jour : 17 novembre 2026. Socle, volets Livre, Carnet et Méditations en place.

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
│  │ SQLite     │     │ Séance audio│     │ book.json     │   │ Supabase │ │
│  │ (Drizzle)  │     │ (playlist)  │     │ (embarqué)    │   │ (option) │ │
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
│   │       ├── carnet/             # index (cycle en cours), cycles, cycle/[id]/{jour/[day], semaine/[week]}, pratique/[ref]
│   │       ├── meditations/        # index, pratique-type/[id], seance (lecteur), minuteur, livre (catalogue), historique, ajouter
│   │       ├── livre/              # index (table des matières), [id] (lecture)
│   │       └── profil.tsx
│   ├── core/
│   │   ├── audio/                  # session.ts (moteur de séance), timeline.ts, sounds.ts, offline.ts (pack hors connexion), player-bar.tsx
│   │   ├── book/                   # Accès au contenu du livre (book.json) et ses types, partagés par les volets
│   │   ├── program.ts              # Les 8 semaines en données (pratiques assises, rappels, E8), partagé Carnet / Méditations
│   │   ├── db/                     # schema.ts, client.ts, provider.tsx
│   │   ├── supabase/client.ts      # null si non configuré
│   │   ├── theme/                  # Tokens de la charte + useTheme
│   │   └── i18n/                   # fr.json
│   ├── features/
│   │   ├── carnet/                 # cycle.ts (calculs purs), store.ts (SQLite), écrans
│   │   ├── book/                   # recherche, rendu, progression
│   │   ├── meditations/            # sitting-sessions.ts (pratiques types), timer.ts, catalog.ts, play.ts, store.ts, écrans
│   │   └── dreams/                 # (v2)
│   ├── content/generated/book.json # Produit par l'import : ne pas éditer à la main
│   └── ui/                         # Text, Screen, Card…
├── drizzle/                        # Migrations SQLite générées (npm run db:generate)
├── supabase/migrations/            # Schéma serveur + RLS
├── scripts/content-import/         # Import WordPress → JSON (+ tests)
├── scripts/audio-pack/             # Pack audio hors connexion, guides des pratiques, sons embarqués (+ tests)
├── assets/                         # Icônes, splash, sounds/ (cloche et silences, générés par audio:build)
└── docs/
```

Règles :
- `src/app/` relie les routes aux écrans, la logique vit dans `src/features/*`.
- Une feature peut dépendre de `src/core` et `src/ui`, pas d'une autre feature. Pour partager, on remonte le code dans `core`.
- Les dossiers `android/` et `ios/` sont générés (`expo prebuild`) et ignorés par git : la configuration native passe par `app.json`.

## 5. Les quatre volets

### 5.1 Carnet d'entraînement
- Le programme est une **donnée** : [src/core/program.ts](../src/core/program.ts) (dans `core` car les Méditations s'en servent aussi) (pratique assise type, références P/E, durées, rappels par catégorie, échelle A–E, 6 obstacles et 9 remèdes de E8). Les `id` des rappels, obstacles et remèdes sont stockés : ne jamais les renommer.
- **Cycles** : on peut refaire les 8 semaines autant de fois qu'on veut. Un seul cycle est `active` ; les autres sont `completed` ou `abandoned` et restent consultables (lecture seule). Commencer un nouveau cycle clôt l'actuel (terminé s'il a ses 56 jours, abandonné sinon) ; un cycle abandonné peut être repris. Suppression logique possible des cycles clos.
- **Avancement jour par jour** ([cycle.ts](../src/features/carnet/cycle.ts)) : le jour à remplir est celui déjà commencé aujourd'hui, sinon le suivant. Une pause ne fait pas sauter de jour. Le jour reçoit sa date à la première saisie ; semaine = `floor(jour / 7) + 1`.
- Écrans : accueil du carnet (carte « Aujourd'hui », pratique type de la semaine, 8 semaines), saisie du jour (durée, expériences positives, obstacles et remèdes en puces + précisions, rappels A–E), synthèse de semaine (les deux tableaux du carnet papier + observations particulières par rappel), « Mes cycles ». Les références P/E ouvrent la section du livre dans la pile du carnet.
- Enregistrement automatique (texte : 600 ms après la frappe, à la sortie du champ et en quittant l'écran).
- Tables : `training_cycles` (+ `status`, `ended_at`, `created_at`), `daily_reports` (+ `obstacle_ids`, `remedy_ids` en JSON), `reminder_ratings`, `reminder_notes`.

### 5.2 Méditations
- **Pratiques types** ([sitting-sessions.ts](../src/features/meditations/sitting-sessions.ts)) : 9 séances (une par étape, deux pour l'étape 5 : pensées / émotions), chacune en **20, 30 ou 40 min**. Pas d'enregistrement dédié : la séance enchaîne le **guidage** de chaque pratique du livre (sa partie parlée, sans cloches ni silence final, découpée par `audio:build`) puis un temps de **pratique en silence**, avec la cloche du livre entre chaque partie.
  - Répartition : chaque pratique dure max(son guidage, k × les minutes prévues par le livre), k étant choisi pour que la séance dure exactement 20, 30 ou 40 min. Le silence va donc aux pratiques dont l'audio est plus court que prévu.
  - Les guidages sont plus longs que les minutes du livre (P9 : 4 min de voix pour 1 min prévue, P32 : 13 min pour 10) : les séances courtes laissent de côté certaines pratiques (`at` dans les données ; un test vérifie que chaque séance tient dans sa durée avec au moins 20 % de silence). Après l'étape 1, P9 devient une minute silencieuse d'installation dans la posture.
  - P29 n'a pas d'audio : pratique en silence. P42 et P43 contiennent leur propre introduction et dédicace : pas d'introduction ni de conclusion génériques autour, et le silence se place **avant** la dédicace (découpée en clip `outro`).
- **Audios du livre** : les 136 audios, par partie, filtrables (pratiques / exposés / tout).
- **Minuteur libre** : durée au choix, cloche au début, à la fin et éventuellement à intervalles réguliers.
- **Séances** : chaque séance de pratique jouée dans l'app (pratique guidée, pratique type, minuteur ; pas les exposés) est enregistrée dans `meditation_sessions` quand elle se termine ou qu'on l'arrête après au moins 1 min (durée réellement écoutée). On peut **ajouter une séance** faite sans l'app (date, heure, durée : `kind = 'manual'`) et en supprimer. Les séances sont indépendantes du carnet.

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
- **Moteur de séance** ([src/core/audio/session.ts](../src/core/audio/session.ts)) : une séance décrite comme une liste de parties (`SessionPlan` : cloche, piste du livre, guidage, clôture, silence) devient **une seule playlist native** (`AudioPlaylist` d'expo-audio, ExoPlayer sur Android). Les enchaînements ne dépendent pas de JavaScript : le minutage reste exact écran verrouillé, là où Android suspend les minuteurs JS. Les durées étant connues d'avance (manifeste), la séance a une seule barre de progression et on peut s'y déplacer ([timeline.ts](../src/core/audio/timeline.ts)). Le moteur vit hors de React : la séance continue quand on quitte l'écran.
- **Sons embarqués** (`assets/sounds/`, générés par `audio:build`) : la cloche des pratiques du livre (ses 5 premières secondes, identiques dans tous les fichiers) et des silences de 1, 5, 30, 120 et 600 s, combinés pour toute durée (11 Ko par minute).
- Lecteur d'une piste dans le livre : [src/core/audio/player-bar.tsx](../src/core/audio/player-bar.tsx) (lecture/pause, ±10 s, barre de progression).

### Guidages des pratiques
Toutes les pratiques du livre suivent le même gabarit : cloche (0–5 s), 2 s de silence, guidage avec ses pauses, long silence de pratique, cloche finale. `audio:build` ([guide.ts](../scripts/audio-pack/guide.ts)) repère la fin du dernier passage parlé (pic au-dessus de -30 dBFS, pauses de moins de 25 s rattachées au guidage) et la cloche finale (énergie à 360 Hz), puis produit `<nom>.guide.m4a` (5 s → fin de la voix + 2 s, fondus) pour les 28 pratiques utilisées par les pratiques types, et `<nom>.outro.m4a` pour P42 et P43. Ils sont décrits dans le manifeste (`guide`, `outro`), hébergés avec le pack (+ 51 Mo) et téléchargés avec lui.

### Pack audio hors connexion
Le site sert des MP3 320 kbps stéréo (1,37 Go pour 136 fichiers, environ 9 h 30). Pour de la voix, c'est inutile :
- `npm run audio:build` télécharge les originaux, les réencode en **AAC 48 kbps mono** (environ 6 fois plus léger) et écrit le manifeste `src/content/generated/audio.json` (fichier, taille, durée par URL d'origine).
- Les fichiers sont publiés comme pièces jointes de la release GitHub `audio-vN` du dépôt (`npm run audio:build -- --upload`, nécessite `gh`). Changer les fichiers impose d'incrémenter la release : l'app supprime alors les fichiers de l'ancienne.
- Dans l'app ([src/core/audio/offline.ts](../src/core/audio/offline.ts)) : rien n'est téléchargé sans accord. L'accueil propose le téléchargement, le Profil affiche la progression (pause, reprise, suppression). Un téléchargement interrompu reprend au lancement suivant ; chaque fichier est vérifié par sa taille.
- Ordre de lecture d'un audio : copie locale, sinon version légère en streaming depuis la release, sinon (erreur) le fichier original du site.
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
| 2 | Méditations (pratiques types 20/30/40 min, audios du livre, minuteur libre, séances et ajout manuel) | ✅ |
| 3 | Carnet (cycles, saisie quotidienne, rappels A–E) | ✅ |
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
| Carnet v1 | Avancement jour par jour (pas calendaire), un seul cycle en cours, obstacles/remèdes E8 en puces + texte libre, écran « Aujourd'hui » + synthèse par semaine |
| Méditations v1 | Pratiques types **assemblées** à partir des audios du livre (voix des auteurs, pas de voix de synthèse), en 20/30/40 min ; étape 5 en deux séances (pensées, émotions) ; minuteur libre ; séances enregistrées et ajout manuel, **indépendants du carnet** |

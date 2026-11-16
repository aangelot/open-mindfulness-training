# Open Mindfulness Training — application mobile

Application compagnon de [openmindfulness.net](https://www.openmindfulness.net/) : carnet d'entraînement de 8 semaines, méditations guidées et minuteur, livre complet hors-ligne.

- Architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Stack : Expo SDK 58 (React Native) + TypeScript, SQLite local, Supabase optionnel

## Démarrer

Prérequis : Node.js LTS, et Android Studio (SDK + émulateur) pour lancer l'app localement.

```bash
npm install
npm run android        # build de développement + lancement sur émulateur/appareil
npm start              # serveur de développement (une fois le build installé)
```

Sans Android Studio, un build de développement peut être fait dans le cloud : `npx eas-cli@latest build --profile development -p android`.

Comptes et synchronisation (facultatif) : copier `.env.example` en `.env` et renseigner l'URL et la clé *anon* Supabase.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Tests Jest |
| `npm run content:import` | Réimporte le livre depuis le site → `src/content/generated/book.json` |
| `npm run audio:build` | Réencode les audios du livre et écrit `src/content/generated/audio.json` (`-- --upload` : publie la release GitHub, nécessite `gh` et `ffmpeg`) |
| `npm run db:generate` | Génère une migration SQLite après modification de `src/core/db/schema.ts` |

## Licences

- Code : [MIT](LICENSE)
- Contenu (textes, audios, programme d'entraînement) : [CC BY-NC-SA 4.0](CONTENT_LICENSE.md)

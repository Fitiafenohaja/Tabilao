# Tabilao

> **Vos données, simplement.** — *Ny angon-tsonao, tsotra.*

Tabilao est une application Android **100 % hors ligne** qui transforme les tableaux Excel des commerçants en **formulaires de saisie rapide**. Ventes, dépenses, stock, crédits clients : on saisit une information une seule fois, l'application calcule et range tout, sans connexion ni compte en ligne.

*Tabilao* signifie « tableau » en malgache. Le projet vise d'abord les commerçants et petites entreprises de Madagascar, qui travaillent souvent sur des téléphones d'entrée de gamme et avec un réseau irrégulier.

![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo)
![React Native 0.88](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-hors%20ligne-003B57?logo=sqlite)
![Android 8+](https://img.shields.io/badge/Android-8.0%2B-3DDC84?logo=android)

> **Statut : MVP en développement.** L'application n'est pas encore publiée sur le Play Store.

---

## Sommaire

- [Pourquoi Tabilao ?](#pourquoi-tabilao-)
- [Fonctionnalités](#fonctionnalités)
- [Démarrage rapide](#démarrage-rapide)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Confidentialité et sécurité](#confidentialité-et-sécurité)
- [Tests](#tests)
- [Feuille de route](#feuille-de-route)
- [Contribuer](#contribuer)
- [Documentation](#documentation)
- [Licence](#licence)

---

## Pourquoi Tabilao ?

Sur téléphone, saisir des ventes dans Excel est lent, répétitif et source d'erreurs, surtout sans maîtrise des formules. Beaucoup de commerçants reviennent au cahier papier. Tabilao ne reproduit pas Excel : il simplifie les opérations du quotidien.

| Principe | Concrètement |
|---|---|
| **Hors ligne d'abord** | Aucun appel réseau, aucun compte. Tout fonctionne en mode avion. |
| **Le téléphone est la source de vérité** | Une base SQLite locale. Rien ne sort du téléphone sans un geste de l'utilisateur. |
| **Saisie en 3 gestes** | Toucher « + Saisie », remplir 2 ou 3 champs (le reste est prérempli ou calculé), enregistrer. |
| **Appareils modestes** | Conçu pour Android 8+ avec 2 Go de RAM. |
| **Langues locales** | Français et malgache, anglais en complément. |

## Fonctionnalités

- **Tableaux personnalisés** : texte, nombre, montant, date, oui/non, liste de choix, champ calculé.
- **Modèles prêts à l'emploi** : ventes, dépenses, stock, crédits clients (*trosa*).
- **Saisie rapide** : formulaire généré automatiquement, date du jour préremplie, calcul en direct, « Enregistrer et ajouter un autre ».
- **Quantités souples** : `1,5`, `1.5`, `1 000`, `1/2` ou `½` sont compris de la même façon en saisie et à l'import ; boutons − / + ; unité fixe (kg) ou choisie ligne par ligne (pièce, kg, litre, kapoaka, sachet…) ; option « nombres entiers seulement » pour ce qui se vend à la pièce.
- **Formules simples et sûres** : `{Quantité} * {Prix unitaire}`, `SOMME`, `MOYENNE`, `MIN`, `MAX`, `SI(…; …; …)`, pourcentages. Un interpréteur maison, sans `eval`, refuse les références circulaires. Tout calcul qui dépend d'un montant est arrondi à l'ariary.
- **Import Excel et CSV** en 10 étapes : choix de la feuille, ligne d'en-tête, association des colonnes, détection des doublons et des valeurs invalides, import en une seule transaction, rapport d'erreurs exportable.
- **Export** `.xlsx` (avec ligne de totaux) ou `.csv`, partageable par WhatsApp, e-mail ou Drive.
- **Recherche et filtres** : recherche plein texte (FTS5), période (aujourd'hui, semaine, mois), tri, total du résultat filtré.
- **Accueil** : recettes, dépenses et solde du jour, alertes de stock bas et de sauvegarde ancienne.
- **Sauvegarde et restauration** : fichier `.tabilao` partageable, sauvegarde automatique quotidienne (7 versions), restauration vérifiée et transactionnelle.
- **Verrouillage** optionnel par code de 4 à 6 chiffres ou empreinte digitale, avec reverrouillage automatique.
- **Corbeille** de 30 jours et journal local des actions importantes.
- **Interface accessible** : cibles tactiles de 48 dp, contraste AA vérifié en mode clair et sombre, lecteurs d'écran pris en charge.

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) 20 ou plus récent
- Un téléphone Android avec [Expo Go](https://expo.dev/go) compatible SDK 58, **ou** le SDK Android pour un build de développement

### Installation

```bash
git clone https://github.com/Fitiafenohaja/Tabilao.git
cd Tabilao
npm install
```

> Le fichier `.npmrc` active `legacy-peer-deps` pour contourner un conflit de dépendances optionnelles de `@hookform/resolvers`.

### Lancer sur un téléphone avec Expo Go

```bash
npx expo start
```

Scannez le QR code avec Expo Go. Le téléphone et l'ordinateur doivent être sur le même réseau Wi-Fi. Sinon, utilisez `npx expo start --tunnel`.

### Build de développement (modules natifs)

```bash
npx expo run:android
# ou dans le cloud, sans Android Studio :
npx eas-cli@latest build --profile development --platform android
```

Profils EAS (`eas.json`) :

| Profil | Sortie | Usage |
|---|---|---|
| `development` | APK + client de développement | Développement quotidien |
| `preview` | APK partageable | Tests terrain (carte SD, Bluetooth) |
| `production` | AAB | Play Store |

Les profils `preview` et `production` retirent la permission `INTERNET` du manifeste Android (`APP_VARIANT=production`).

## Scripts

| Commande | Rôle |
|---|---|
| `npm start` | Serveur Metro (Expo Go) |
| `npm run android` | Build natif et lancement sur appareil ou émulateur |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint (configuration Expo) |
| `npm test` | Tests Jest de la logique métier |
| `npm run test:coverage` | Tests avec couverture (seuil : 70 %) |
| `npm run db:generate` | Génère une migration Drizzle depuis `src/data/schema.ts` |
| `npm run doctor` | Diagnostic `expo-doctor` |

## Architecture

Architecture en couches : une couche n'appelle que celle du dessous. Un écran n'écrit jamais en SQL.

```
Écrans (Expo Router)          src/app/
   ↓
Hooks et stores (Zustand)     src/features/
   ↓
Services métier (TS pur)      src/services/     ← formules, import/export, sauvegarde, règles, sécurité
   ↓
Repositories (Drizzle ORM)    src/data/
   ↓
SQLite (WAL, JSON1, FTS5)     expo-sqlite
```

### Structure du projet

```
src/
├── app/                 Écrans et navigation (Expo Router)
│   ├── (tabs)/          Menu principal : Accueil · Tableaux · Données · Réglages
│   ├── tables/          Consultation, saisie, détail, éditeur de champs
│   ├── import/          Assistant d'import
│   └── …                Sauvegarde, verrouillage, premier démarrage
├── features/            Logique d'écran par domaine (hooks, stores, étapes d'import, écran de verrouillage)
├── services/            Logique métier sans React, testée avec Jest
├── data/                Base : ouverture, schéma, migrations, repositories
├── ui/                  Design system : tokens, composants, icônes, barre de navigation
├── templates/           Modèles ventes, dépenses, stock, crédits
└── i18n/                Traductions fr / mg / en
tests/
├── services/            Tests unitaires
└── e2e/                 Parcours Maestro (exécutés en mode avion)
docs/                    Cahier des charges et document d'architecture
```

### Choix techniques

| Besoin | Choix |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, TypeScript strict |
| Navigation | Expo Router (barre basse personnalisée) |
| Base de données | `expo-sqlite` (WAL, FTS5) + Drizzle ORM, migrations embarquées |
| Formulaires | React Hook Form + Zod (schéma généré depuis les champs) |
| État | Zustand |
| Listes longues | FlashList (50 000 lignes) |
| Excel et CSV | SheetJS, PapaParse |
| Icônes | Phosphor, importées une à une (seules les icônes utilisées sont embarquées) |
| Langues | i18next |

### Modèle de données

- `records.data_json` stocke `{ idDuChamp: valeur }`. Ajouter, renommer ou réordonner un champ ne demande **aucune migration**.
- **Montants en entiers** (ariary). Jamais de nombres à virgule pour l'argent.
- Dates au format ISO 8601, identifiants UUID v4, suppression logique (`deleted_at`).
- Le type de champ « Référence » et la table `rules` préparent le lien ventes → stock.

### Design

Les couleurs reprennent le drapeau malgache : **vert** pour les actions et les recettes, **blanc** pour les fonds, **rouge** pour les alertes et les dépenses. Une fine bande tricolore sert de signature visuelle. Toutes les couleurs passent par les tokens de `src/ui/theme.ts`, avec des paires texte/fond vérifiées au niveau AA. Détails dans [le document d'architecture](docs/tabilao-architecture-design.md).

## Confidentialité et sécurité

- **Aucune donnée ne quitte le téléphone** sans action explicite de l'utilisateur (partage, export). Pas de télémétrie, pas de suivi des plantages en ligne.
- **Écritures transactionnelles** : un import, une restauration ou une règle entre tableaux réussit entièrement ou ne change rien.
- **Verrouillage** : le code n'est jamais stocké en clair (SHA-256 salé), blocage progressif après 5 erreurs.
- **Limite connue** : le verrou protège l'accès à l'application, pas le fichier de base ni les sauvegardes `.tabilao`. Le chiffrement AES-256 des sauvegardes est prévu.

Pour signaler une faille de sécurité, merci de ne pas ouvrir de ticket public : contactez le mainteneur directement via son profil GitHub.

## Tests

```bash
npm test               # tests unitaires (formules, validation, import/export, règles, sécurité…)
npm run test:coverage  # avec couverture
```

Les parcours de bout en bout (dossier `tests/e2e/`) utilisent [Maestro](https://maestro.mobile.dev/) et doivent tourner **en mode avion** :

```bash
maestro test tests/e2e
```

## Feuille de route

**MVP**
- [x] Tableaux, champs personnalisés et modèles
- [x] Saisie rapide et champs calculés
- [x] Recherche, filtres et totaux
- [x] Import et export Excel / CSV
- [x] Sauvegarde, restauration et corbeille
- [x] Verrouillage par code et empreinte
- [ ] Chiffrement AES-256 des sauvegardes
- [ ] Choix de la devise
- [ ] Tests d'intégration sur une vraie base SQLite
- [ ] Relecture des traductions malgaches par des locuteurs natifs

**v1.1**
- [ ] Lien ventes → stock (le stock baisse à chaque vente)
- [ ] Carnet de crédit avec rappel WhatsApp ou SMS
- [ ] Reçu partagé sur WhatsApp

**v2 (à valider avec des commerçants pilotes)**
- [ ] Scan d'un cahier ou d'un ticket (reconnaissance de texte sur l'appareil)
- [ ] Import des SMS Mobile Money (MVola, Orange Money, Airtel Money)
- [ ] Saisie vocale

## Contribuer

Les contributions sont les bienvenues, en particulier :

- **les traductions malgaches** (`src/i18n/mg.json`), aujourd'hui à relire ;
- les retours de commerçants sur l'usage réel ;
- les tests sur des appareils Android d'entrée de gamme.

Avant d'ouvrir une pull request :

```bash
npm run typecheck && npm run lint && npm test
```

Conventions :
- aucun texte en dur dans les écrans : les clés vont dans `src/i18n/{fr,mg,en}.json` ;
- la logique métier va dans `src/services/` (TypeScript pur, testé) ;
- les couleurs passent par `useTheme()` et les tokens ;
- les dépendances s'installent avec `npx expo install` ;
- les commits suivent la convention `feat:`, `fix:`, `refactor:`, `test:`, `docs:` ;
- une migration publiée n'est jamais modifiée : il faut en créer une nouvelle.

Le fichier [`AGENTS.md`](AGENTS.md) résume ces règles pour les assistants de code.

## Documentation

- [Cahier des charges v1.2](docs/Cahier%20des%20charges%20%E2%80%94%20Tabilao%20Mobile%20v1.2.md) : besoins, périmètre, indicateurs de réussite
- [Architecture et design system](docs/tabilao-architecture-design.md) : couches, modèle de données, couleurs, composants

## Licence

Licence à définir. En attendant, tous droits réservés par l'auteur.

---

Conçu à Madagascar par [@Fitiafenohaja](https://github.com/Fitiafenohaja).

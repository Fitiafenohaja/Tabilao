# Cahier des charges — Tabilao Mobile v1.2

Oct 23, 2026 · @August Tino

Tabilao Mobile (ex-EasyTable Mobile) est une application Android offline-first, en React Native, Expo et TypeScript avec SQLite, qui transforme les tableaux Excel des commerçants en formulaires de saisie rapide. Slogan : « Vos données, simplement. » Cette version 1.2 complète la v1.1 (sections 5.9 à 12) et ajoute des améliorations innovantes adaptées au contexte malgache.

## 1. Présentation générale

**Contexte.** Commerçants et petites entreprises suivent ventes, dépenses, stocks et clients dans Excel. Sur téléphone, la saisie y est lente, répétitive et source d'erreurs, surtout pour qui ne maîtrise pas les formules.

**Produit.** Tabilao (du malgache « tabilao », tableau) permet de créer des tableaux personnalisés, de les remplir via des formulaires, d'automatiser les calculs simples, d'importer et exporter Excel/CSV, de rechercher, et de sauvegarder les données, sans connexion.

**Promesse.** Saisir une information une seule fois, laisser l'application calculer, retrouver les données prêtes à l'emploi. Tabilao ne reproduit pas Excel : il simplifie les opérations répétitives du quotidien.

## 2. Objectifs

**Objectif général.** Simplifier et accélérer la saisie, l'organisation et l'exploitation des données professionnelles habituellement gérées dans Excel, via une interface intuitive, des formulaires personnalisables et une base SQLite locale.

**Objectifs spécifiques.**

- Réduire le temps de saisie et les erreurs.
- Créer des tableaux sans compétence technique.
- Transformer un fichier Excel existant en formulaire.
- Automatiser les calculs courants.
- Faciliter recherche et consultation.
- Garantir l'usage hors ligne, l'export, la sauvegarde et la restauration.
- Préparer une architecture évolutive.

**Indicateurs de réussite (à valider par tests utilisateurs réels).**

| Indicateur | Cible | Mesure |
| --- | --- | --- |
| Temps de saisie vs Excel mobile | −30 % minimum | Chronométrage sur 3 scénarios (vente, dépense, stock) |
| Actions pour un enregistrement courant | ≤ 5 tapes | Test d'usabilité |
| Persistance après fermeture et redémarrage | 100 % | Tests automatisés |
| Fiabilité import/export | 100 % des fichiers de référence | Jeu de 20 fichiers test |
| Perte de données en transaction | 0 | Tests d'interruption (coupure, kill) |
| Premier tableau créé sans aide | ≥ 80 % des testeurs | Test avec 10 nouveaux utilisateurs |

## 3. Public cible

| Profil | Besoin principal | Usage typique |
| --- | --- | --- |
| Commerçant (épicerie, quincaillerie, boutique) | Ventes, stock, dépenses, crédits clients | Saisie plusieurs fois par jour |
| Indépendant (artisan, prestataire) | Prestations, recettes, clients | Saisie quotidienne |
| Petite entreprise | Données commerciales et opérationnelles | Consultation et rapports |

Niveaux : débutant (saisie sans formules), régulier (création, filtres, import), gestionnaire (consultation, rapports). La v1 cible un utilisateur unique sur un appareil Android ; multi-comptes et collaboration viendront plus tard.

## 4. Périmètre

**Inclus dans le MVP :** base SQLite, tableaux, champs personnalisés, saisie rapide, CRUD contrôlé des enregistrements, recherche/tri/filtres, calculs simples, modèles, import et export Excel/CSV, hors ligne, sauvegarde/restauration, validation et gestion des erreurs.

**Exclu du MVP :** synchronisation cloud, collaboration temps réel, multi-utilisateurs, comptabilité complète, paiements avancés, macros VBA, toutes les formules Excel, assistant IA conversationnel, iOS, abonnements et multi-entreprises.

## 5. Fonctionnalités détaillées

### 5.1 Premier démarrage

Au premier lancement, l'application initialise la base SQLite et propose trois actions : créer un tableau, utiliser un modèle, importer un fichier Excel ou CSV. Aucun compte en ligne n'est requis. Un écran explique que les données restent sur le téléphone et invite à activer une sauvegarde.

### 5.2 Gestion des tableaux

Un tableau a un nom, une description facultative, une catégorie, des champs et un ordre d'affichage. L'utilisateur peut le consulter, modifier, rechercher, dupliquer, archiver ou supprimer. Toute suppression est confirmée ; l'archivage est proposé en premier.

### 5.3 Gestion des champs

| Type | Exemple d'usage | Stockage SQLite |
| --- | --- | --- |
| Texte | Nom, référence, description | TEXT |
| Nombre | Quantité, prix, montant | INTEGER (montants en ariary entiers) ou REAL |
| Date | Date d'une opération | TEXT ISO 8601 |
| Booléen | Payé oui/non | INTEGER 0/1 |
| Liste de choix | Catégorie, statut, paiement | TEXT (valeur d'une liste définie) |
| Champ calculé | Montant = quantité × prix | Recalculé, mis en cache |

Chaque champ a un nom, un type, un caractère obligatoire, une valeur par défaut, un ordre et des règles de validation (min, max, longueur, format). Les formules sont analysées par un interpréteur maison limité aux opérations autorisées : aucun `eval` ni code arbitraire.

### 5.4 Saisie rapide (fonction centrale)

- Formulaire généré pour chaque tableau, champs dans l'ordre défini.
- Préremplissage : date du jour, dernières valeurs, valeurs par défaut.
- Autocomplétion à partir des valeurs déjà saisies (produits, clients).
- Duplication d'une opération précédente.
- Validation immédiate et calcul en direct des champs calculés.
- Boutons « Enregistrer » et « Enregistrer et ajouter un autre ».
- Réinitialisation du formulaire avec confirmation si des données sont saisies.
- Confirmation visuelle et vibration courte après enregistrement.

### 5.5 Gestion des enregistrements

Ajout, consultation, modification, duplication et suppression. Chaque ligne conserve `created_at` et `updated_at`. La suppression est logique (`deleted_at`) avec corbeille restaurable 30 jours. Un journal local trace les actions importantes (import, suppression, restauration).

### 5.6 Recherche et filtrage

Recherche textuelle, filtre par champ, par période (aujourd'hui, semaine, mois, plage), par catégorie ou statut, tri ascendant/descendant, nombre de résultats affiché, réinitialisation en un geste. La recherche porte sur le tableau sélectionné.

### 5.7 Calculs automatiques

Opérations : addition, soustraction, multiplication, division (diviseur nul refusé), total, moyenne, minimum, maximum, pourcentage simple. Les champs calculés sont recalculés à chaque modification d'une source. Les montants sont stockés en entiers (ariary, ou centimes pour une devise à décimales) pour éviter les erreurs d'arrondi.

### 5.8 Modèles prédéfinis

| Modèle | Champs |
| --- | --- |
| A — Suivi des ventes | Date, produit, quantité, prix unitaire, montant total (calculé), mode de paiement, commentaire |
| B — Suivi des dépenses | Date, catégorie, description, montant, mode de paiement, justificatif (photo) |
| C — Suivi du stock | Référence, nom, quantité disponible, seuil d'alerte, prix unitaire, date de mise à jour |

Les modèles utilisent le même moteur que les tableaux personnalisés et restent modifiables.

### 5.9 Importation Excel et CSV

Formats : `.xlsx` et `.csv` (séparateur `,` ou `;` détecté, encodage UTF-8 ou Windows-1252). Parcours :

1. Sélection du fichier.
2. Lecture et validation (taille max 10 Mo, 20 000 lignes).
3. Choix de la feuille si plusieurs.
4. Identification des en-têtes.
5. Prévisualisation des 20 premières lignes.
6. Association des colonnes aux champs, avec types proposés automatiquement.
7. Détection des doublons potentiels.
8. Signalement des valeurs invalides, ligne par ligne.
9. Confirmation.
10. Import en transaction unique, puis rapport final : lignes importées, ignorées, corrigées, avec export du rapport d'erreurs.

Les formules Excel sont importées comme valeurs ; une formule simple reconnue (A×B, A+B) peut devenir un champ calculé.

### 5.10 Exportation Excel et CSV

Export du tableau complet ou du résultat filtré, en `.xlsx` (en-têtes, types, largeur de colonnes, ligne de totaux) ou `.csv` UTF-8. Partage via la feuille de partage Android (WhatsApp, e-mail, Drive).

### 5.11 Fonctionnement hors ligne

Toutes les fonctions du MVP marchent sans réseau. Aucune donnée ne quitte le téléphone sans action de l'utilisateur.

### 5.12 Sauvegarde et restauration

- Sauvegarde manuelle : fichier `.tabilao` (copie SQLite compressée et horodatée) partageable.
- Sauvegarde automatique locale quotidienne, 7 versions conservées.
- Rappel si aucune sauvegarde externe depuis 7 jours.
- Restauration avec vérification d'intégrité et de version du schéma, et sauvegarde préalable de l'état courant.

### 5.13 Validation et gestion des erreurs

Messages en français clair, placés sous le champ concerné. Les erreurs techniques sont journalisées localement sans planter l'application. Toute écriture multiple (import, restauration, migration) est transactionnelle : tout réussit ou rien ne change.

## 6. Exigences non fonctionnelles

L'application doit rester fluide sur un Android d'entrée de gamme (2 Go de RAM), le parc dominant chez les commerçants visés.

| Domaine | Exigence | Cible mesurable |
| --- | --- | --- |
| Compatibilité | Android 8.0 (API 26) et plus | Testé sur 3 appareils, dont un 2 Go RAM |
| Démarrage | Lancement à froid | < 2 s |
| Saisie | Enregistrement d'une ligne | < 100 ms |
| Volumétrie | Liste paginée et recherche | 50 000 lignes par tableau, recherche < 500 ms |
| Taille | APK / AAB | < 40 Mo |
| Fiabilité | Écritures transactionnelles, mode WAL | 0 perte sur tests d'interruption |
| Sécurité | Verrouillage PIN ou biométrie optionnel ; sauvegardes chiffrables (AES-256) | Activable en 2 tapes |
| Confidentialité | Aucune collecte sans consentement ; télémétrie désactivée par défaut | Conforme loi malgache n° 2014-038 sur les données personnelles |
| Accessibilité | Cibles tactiles ≥ 48 dp, contraste AA, taille de police système respectée | Audit manuel |
| Langues | Français et malgache dès le MVP, anglais ensuite | i18n sur 100 % des textes |
| Ergonomie | Utilisable d'une main, clavier numérique sur champs nombre | Test utilisateurs |
| Maintenabilité | TypeScript strict, tests unitaires du moteur de calcul et de l'import | Couverture ≥ 70 % sur la logique métier |

## 7. Architecture technique

L'application suit une architecture en couches où le moteur de calcul, l'import/export et la sauvegarde ne dépendent d'aucun écran : ils sont testables seuls et réutilisables pour une future version iOS ou web.

&#91;embedded content: architecture applicative · 5 couches\]

Chaque couche n'appelle que celle du dessous ; la couche services (en couleur) concentre la logique critique et la couverture de tests.

### 7.1 Pile technique

| Besoin | Choix | Raison |
| --- | --- | --- |
| Framework | React Native + Expo (workflow géré), TypeScript strict | Imposé par le projet ; builds via EAS |
| Base de données | expo-sqlite, mode WAL, extensions JSON1 et FTS5 | Local, rapide, recherche plein texte |
| ORM et migrations | Drizzle ORM | Requêtes typées, migrations versionnées |
| Excel | SheetJS (xlsx) | Lecture et écriture .xlsx hors ligne |
| CSV | PapaParse | Détection du séparateur, gros fichiers |
| Formulaires | React Hook Form + Zod | Schéma de validation généré depuis les champs |
| État | Zustand | Léger, simple |
| Listes longues | FlashList | Défilement fluide sur 50 000 lignes |
| Fichiers et partage | expo-document-picker, expo-file-system, expo-sharing | Import, sauvegarde, envoi |
| Sécurité | expo-local-authentication, expo-crypto | PIN, biométrie, chiffrement des sauvegardes |
| Langues | i18next | Français, malgache, anglais |

### 7.2 Modèle de données SQLite

Les valeurs des enregistrements sont stockées en JSON dans une seule table, ce qui permet d'ajouter ou renommer des champs sans migration de schéma.

| Table | Colonnes principales | Rôle |
| --- | --- | --- |
| `app_meta` | key, value | Version du schéma, date de dernière sauvegarde, préférences |
| `data_tables` | id, name, description, category, position, archived\_at, created\_at, updated\_at | Tableaux de l'utilisateur |
| `fields` | id, table\_id, name, type, required, default\_value, position, options\_json, validation\_json, formula | Définition des champs |
| `records` | id (UUID), table\_id, data\_json, created\_at, updated\_at, deleted\_at | Lignes ; `data_json` = {field\_id: valeur} |
| `records_fts` | record\_id, content (FTS5) | Index de recherche plein texte |
| `attachments` | id, record\_id, field\_id, file\_uri, created\_at | Justificatifs photo |
| `action_log` | id, action, entity, entity\_id, payload\_json, created\_at | Journal local et annulation |

Index : `records(table_id, deleted_at, created_at)` et index d'expression `json_extract` sur les champs date et catégorie les plus filtrés. Les identifiants UUID préparent la future synchronisation.

### 7.3 Moteur de formules

Un analyseur dédié (tokenizer + arbre syntaxique) n'accepte que les références de champs, nombres, `+ − × ÷ %`, parenthèses et les fonctions `SOMME`, `MOYENNE`, `MIN`, `MAX`, `SI`. Les références circulaires sont refusées à l'enregistrement du champ.

## 8. Écrans principaux

| Écran | Contenu | Action principale |
| --- | --- | --- |
| Accueil | Tableaux récents, totaux du jour, alerte sauvegarde | Bouton flottant « + Saisie » |
| Liste des tableaux | Recherche, catégories, archivés | Créer, modèle, importer |
| Éditeur de tableau | Champs glissables, types, formules | Ajouter un champ |
| Saisie rapide | Formulaire généré, calcul en direct | Enregistrer / et ajouter un autre |
| Consultation | Liste ou cartes, filtres, totaux en pied | Filtrer, exporter |
| Détail d'un enregistrement | Valeurs, historique, justificatif | Modifier, dupliquer |
| Assistant d'import | Les 10 étapes de 5.9 | Confirmer l'import |
| Sauvegarde et réglages | Langue, PIN, devise, sauvegardes | Sauvegarder maintenant |

## 9. Planning

Le MVP est livrable en 14 semaines par une équipe d'un ou deux développeurs, avec un jalon de validation utilisateur toutes les trois à cinq semaines.

&#91;embedded content: planning du MVP · 14 semaines, 6 phases\]

Le jalon 4 n'est franchi que si les indicateurs de la section 2 sont atteints sur la bêta.

## 10. Tests et recette

- **Unitaires** (Jest) : moteur de formules, validation, conversion des montants, parseurs d'import.
- **Intégration** : repositories sur une vraie base SQLite, migrations ascendantes, restauration de sauvegarde.
- **Bout en bout** (Maestro) : premier démarrage, création par modèle, saisie, filtre, export.
- **Robustesse** : coupure de l'application pendant un import, batterie faible, stockage plein.
- **Terrain** : 20 commerçants pilotes pendant 2 semaines, chronométrage contre leur méthode actuelle.

Critères de recette : toutes les fonctions MVP passées, zéro anomalie bloquante, indicateurs de la section 2 atteints.

## 11. Risques

| Risque | Probabilité | Impact | Parade |
| --- | --- | --- | --- |
| Perte de téléphone = perte des données | Élevée | Critique | Sauvegarde auto, rappels, export WhatsApp/Drive en un geste |
| Fichiers Excel hétérogènes (cellules fusionnées, en-têtes sur 2 lignes) | Élevée | Moyen | Assistant d'import tolérant, choix manuel de la ligne d'en-tête |
| Lenteur sur appareils d'entrée de gamme | Moyenne | Élevé | Pagination, FlashList, tests sur appareil 2 Go |
| Adoption faible face au cahier papier | Moyenne | Élevé | Modèles prêts, interface en malgache, accompagnement terrain |
| Corruption de la base | Faible | Critique | Mode WAL, transactions, contrôle d'intégrité au démarrage |
| Glissement vers un clone d'Excel | Moyenne | Moyen | Périmètre MVP strict, formules limitées |

## 12. Améliorations innovantes proposées

La découverte principale : les trois modèles (ventes, dépenses, stock) sont aujourd'hui des tableaux isolés, alors que le commerçant vit des flux qui les relient. Relier les tableaux entre eux, et faire entrer les données par la photo, la voix et le Mobile Money plutôt que par le clavier, transforme Tabilao d'un « Excel simplifié » en assistant de gestion de boutique.

&#91;embedded content: améliorations proposées · impact × effort\]

Les points colorés sont les recommandations : gains rapides en v1.1 (environ 6 semaines après le MVP), paris stratégiques à prototyper dès la bêta. Positions estimées, à confirmer avec les commerçants pilotes.

| Amélioration | Problème résolu | Fonctionne hors ligne | Version |
| --- | --- | --- | --- |
| Lien ventes → stock | Le stock n'est jamais à jour car saisi deux fois | Oui | v1.1 |
| Carnet de crédit clients (« trosa ») | Les ventes à crédit sont notées sur papier et oubliées | Oui ; rappel envoyé via WhatsApp | v1.1 |
| Reçu partagé sur WhatsApp | Le client veut une preuve d'achat | Oui (image ou PDF généré localement) | v1.1 |
| Scan du cahier ou du ticket (OCR) | Des années d'historique sur cahier papier | Oui (reconnaissance sur l'appareil) | v2 |
| Saisie vocale | Mains occupées au comptoir | Oui en français ; malgache à évaluer | v2 |
| Import SMS Mobile Money | Les paiements MVola, Orange Money, Airtel Money sont ressaisis | Oui | v2 |
| Résumé du jour et widget Android | Savoir sa recette sans ouvrir l'app | Oui | Selon retours |
| Code-barres pour le stock | Saisie lente des références | Oui | Selon retours |
| Transfert vers un autre téléphone (QR + Wi-Fi local) | Changement ou perte de téléphone | Oui | Selon retours |

### 12.1 Lien entre tableaux : la découverte clé

Un nouveau type de champ « Référence » pointe vers une ligne d'un autre tableau, et une « règle » déclenche une action à l'enregistrement. Exemple : enregistrer une vente de 3 savons diminue de 3 la quantité du produit dans le tableau Stock, et une alerte s'affiche sous le seuil. Le prix unitaire se préremplit depuis le stock, ce qui supprime une saisie et une source d'erreur. Techniquement, c'est une table `rules` et l'exécution dans la même transaction SQLite que l'enregistrement.

### 12.2 Carnet de crédit

Un modèle D « Crédits clients » : client, téléphone, montant dû, remboursements, solde calculé. Un bouton prépare un message de rappel courtois en malgache ou en français et ouvre WhatsApp ou les SMS ; l'utilisateur envoie lui-même. Aucun serveur n'est nécessaire.

### 12.3 Scan du cahier papier

L'utilisateur photographie une page ; la reconnaissance de texte sur l'appareil (Google ML Kit) découpe les lignes et propose des enregistrements dans l'assistant d'import existant (étapes 5 à 10). La reconnaissance est fiable sur l'imprimé et partielle sur l'écriture manuscrite : l'écran de correction est donc au cœur de la fonction. À commencer par les tickets et factures fournisseurs imprimés. Nécessite un build Expo de développement (module natif).

### 12.4 Import des SMS Mobile Money

Google Play réserve la lecture automatique des SMS aux applications de messagerie par défaut. Tabilao passe donc par le partage Android : l'utilisateur partage un ou plusieurs SMS de confirmation vers Tabilao, qui en extrait montant, expéditeur, référence et date, puis propose l'enregistrement. Les formats de chaque opérateur sont décrits dans des fichiers de motifs mis à jour avec l'application.

### 12.5 Saisie vocale

Phrase type : « vente 3 savons 1500 ariary ». La reconnaissance vocale hors ligne d'Android couvre le français ; un analyseur local associe nombres et mots aux champs du formulaire, que l'utilisateur valide avant enregistrement. Pour le malgache, un vocabulaire de mots-clés (vidiny, isa, nivarotra) est à tester en bêta.

### 12.6 Recommandation

Intégrer dès maintenant au schéma du MVP le champ « Référence » et la table `rules`, même vides : cela coûte peu et évite une migration lourde pour la v1.1. Lancer en parallèle de la bêta un prototype du scan et de l'import SMS auprès de 5 commerçants pour valider leur valeur avant de les développer.

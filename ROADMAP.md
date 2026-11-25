# Feuille de route (Roadmap) - pasdehasard

## Objectif principal
Reproduire fidèlement et intégralement l'application de gestion d'atelier d'improvisation (pasdehasard) sans le système de sauvegarde distant pour l'instant, avec une interface sobre, réactive et modulaire.

---

## État d'avancement

### Étape 1 : Structure et Intégration du socle ✅
- [x] Récupération et analyse de la structure complète du dépôt source
- [x] Mise en place des styles globaux et variables CSS (thème atelier sombre, palettes participants, etc.)
- [x] Intégration des modèles de données (`types.ts`, `constants.ts`, `StateFactory.ts`, `restoredData.ts`)
- [x] Intégration du moteur algorithmique de tirage de groupes (`GroupGenerator.ts`)
- [x] Intégration des utilitaires (`helpers.ts`)

### Étape 2 : Contexte d'état en mémoire & Architecture modulaire ✅
- [x] Adaptation du contexte global (`GlobalContext.tsx` et gestionnaire d'état) fonctionnant en mémoire sans dépendre d'une connexion Firebase externe
- [x] Organisation modulaire des composants dans `/src/components` pour maintenir `App.tsx` le plus concis et maintenable possible

### Étape 3 : Vues & Fonctionnalités ✅
- [x] **Vue Atelier** : Chronomètres (Échauffement, Plateau, Impro, Débrief), tirage et répartition des groupes (Principal / Bonus), gestion drag & drop, verrouillages, présences, fenêtres de temps
- [x] **Vue Algorithme** (`AlgoConfigView`) : Critères de tirage, pondérations, historique, templates
- [x] **Vue Prog** (`ProgView`) : Programmation et notes d'atelier
- [x] **Vue Outils & Config** (`WorkshopConfigView`, `ParticipantManager`, etc.) : Gestion des participants, couleurs, raccourcis, export/import JSON, personnalisation du thème
- [x] **Vue Stats & Historique** (`StatsView`, `CoocTable`, `DurationTable`, `ParticipationTable`, `StatsCharts`, `HistoryEntry`) : Matrices de co-occurrences, durées, graphiques Recharts, édition de l'historique

### Étape 4 : Intégration Firebase Cloud ✅
- [x] Provisionnement de la base Firestore et configuration Firebase Web
- [x] Déploiement des règles de sécurité Firestore (`firestore.rules` & `firebase-blueprint.json`)
- [x] Connexion Google Auth et synchronisation Cloud automatique / manuelle
- [x] Indicateur d'état Cloud en direct dans la barre de navigation

### Étape 5 : Validation & Finitions ✅
- [x] Vérification stricte des confirmations en ligne (sans alert/confirm/popups natifs du navigateur)
- [x] Compilation et tests de fonctionnement sans erreurs de build (`tsc` & `vite build` réussis)

### Étape 6 : Modularité, Interface Inline & Épuration ✅
- [x] Allègement drastique de `App.tsx` via l'extraction de hooks dédiés (`useWorkshopTimers`, `useWorkshopState`, `useFileHandler`)
- [x] Remplacement intégral des fenêtres popups/modales flottantes par des composants et bandeaux inline intégrés dans le flux
- [x] Suppression de l'usage du `localStorage` pour la personnalisation des styles (conformité stricte aux données de connexion)
- [x] Préservation intégrale de toutes les fonctionnalités métier existantes en français sobre et épuré

### Étape 7 : Navigation d'exercices & indicateurs de présence ✅
- [x] Navigation d'exercice ultra-rapide (Exo 1, 2, 3... via boutons ◀ / ▶)
- [x] Compteurs doubles sous le nom (Session / Exercice) et liseré blanc pour les non-passés
- [x] Tag du numéro d'exercice sur les tours d'historique validés et éditeur inline d'exercice
- [x] Critère d'algorithme « Passages Exercice » et preset prioritaire (Exo -> Session -> Cooc)


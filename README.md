# Budget Tracker

Gestionnaire de budget personnel disponible en **version web** (HTML/CSS/JS + Firebase) et en **application mobile** (Expo/React Native).

---

## 📱 Application Mobile (Expo/React Native)

### Fonctionnalités

- **Tableau de bord** avec 3 KPI : Dépenses, Revenus, Solde du mois + variation vs mois précédent
- **Ajout rapide** de transaction via bouton flottant "+"
  - Formulaire court : montant, catégorie, date
  - Mémorisation de la dernière catégorie et du dernier type utilisé
  - Options avancées repliées (date personnalisée)
- **Liste des transactions**
  - Filtres rapides : 7j / 30j / mois / année / tout
  - Filtre par type : revenus / dépenses / épargne
  - Recherche texte (description + catégorie)
  - Regroupement par date avec en-têtes collants
  - Appui long pour : modifier, dupliquer, supprimer
  - Undo après suppression (snackbar "Annuler")
- **Stockage local SQLite** — fonctionne entièrement hors-ligne
- **Duplication de transaction**

### Prérequis

- Node.js ≥ 18
- npm ≥ 9
- [Expo Go](https://expo.dev/client) sur votre téléphone (iOS ou Android) **ou** un émulateur

### Installation

```bash
cd mobile
npm install --legacy-peer-deps
```

### Lancer l'application

```bash
cd mobile
npm start        # Lance le serveur Expo (scanner le QR code avec Expo Go)
npm run android  # Lance sur émulateur Android
npm run ios      # Lance sur simulateur iOS (macOS uniquement)
```

### Exécuter les tests

```bash
cd mobile
npm test         # Lance les tests Jest (mode CI)
npm run test:watch  # Lance les tests en mode watch
```

### Linter et formatage

```bash
cd mobile
npm run lint     # ESLint sur src/
npm run format   # Prettier sur src/
npx tsc --noEmit # Vérification TypeScript
```

---

## 🗂️ Architecture du projet mobile

```
mobile/
├── app.json                   # Configuration Expo
├── App.tsx                    # Point d'entrée
├── babel.config.js            # Configuration Babel
├── eslint.config.js           # Configuration ESLint (flat config)
├── .prettierrc                # Configuration Prettier
├── src/
│   ├── core/                  # Module central partagé
│   │   ├── types.ts           # Types TypeScript (Transaction, Category, etc.)
│   │   ├── calculations.ts    # Fonctions de calcul (totaux, agrégats, filtres)
│   │   ├── formatters.ts      # Helpers de formatage (monnaie, dates)
│   │   ├── validation.ts      # Validation de transaction
│   │   └── index.ts           # Barrel exports
│   ├── data/
│   │   ├── database.ts        # Initialisation SQLite (schéma, connexion)
│   │   └── transactionRepository.ts  # Couche d'accès aux données (CRUD)
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Écran principal avec KPI
│   │   ├── TransactionListScreen.tsx # Liste avec filtres et recherche
│   │   └── AddTransactionScreen.tsx  # Formulaire ajout/modification
│   ├── components/
│   │   ├── FAB.tsx            # Bouton flottant "+"
│   │   ├── KPICard.tsx        # Carte indicateur (KPI)
│   │   ├── TransactionItem.tsx # Ligne de transaction
│   │   ├── FilterBar.tsx      # Barre de filtres (période + type)
│   │   └── UndoSnackbar.tsx   # Toast "Annuler" après suppression
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation (tabs: Dashboard + Transactions)
│   ├── hooks/
│   │   ├── useTransactions.ts # Hook principal (état + CRUD + filtres + undo)
│   │   └── useDashboard.ts    # Hook calculs dashboard (memoïsé)
│   └── constants/
│       └── theme.ts           # Couleurs, espacements, typographie
└── __tests__/
    └── core/
        ├── calculations.test.ts  # Tests calculs métier
        ├── validation.test.ts    # Tests validation
        └── formatters.test.ts    # Tests formatage
```

---

## 📐 Convention de format des transactions

```typescript
interface Transaction {
  id: string;          // Identifiant unique (généré automatiquement)
  type: 'income' | 'expense' | 'savings'; // Type de transaction
  amount: number;      // Montant en euros (> 0, ≤ 999 999 999)
  category: string;    // Catégorie (ex: "Courses", "Salaire")
  description: string; // Description (1–200 caractères)
  date: string;        // Date au format YYYY-MM-DD
  createdAt: string;   // Date de création (ISO 8601)
  updatedAt: string;   // Date de modification (ISO 8601)
}
```

### Catégories disponibles

**Dépenses** : Courses, Appartement, Crédit de voiture, Crédit immobilier, Appartement > Box, Appartement > SFR, Shopping, Transport, Loisirs, Loisirs > Restaurant, Santé, Éducation, Frais Bancaire, Facture, Autre

**Revenus** : Salaire, Freelance, Investissement, Cadeau, Autre

**Épargne** : Livret A, PEA, Assurance Vie, Trade Republic, Trading, Autre

---

## 🌐 Application Web

L'application web originale se trouve à la racine du repository :

- `index.html` — Interface principale
- `style.css` — Feuilles de style
- `script.js` — Logique métier (vanilla JS)
- `firebase-config.js` — Configuration Firebase (sync cloud)

Ouvrir `index.html` dans un navigateur pour l'utiliser localement.

Voir `FIREBASE_SETUP.md` pour configurer la synchronisation Firebase.

---

## 🔒 Sécurité

Voir [SECURITY.md](./SECURITY.md) pour la politique de sécurité.

---

## 🧪 CI/CD

GitHub Actions (`.github/workflows/mobile-ci.yml`) exécute automatiquement sur chaque PR touchant `mobile/` :

1. `npm ci` — Installation des dépendances
2. `npm run lint` — ESLint
3. `npx tsc --noEmit` — Vérification TypeScript
4. `npm test` — Jest (66 tests unitaires)
5. Vérification `app.json`

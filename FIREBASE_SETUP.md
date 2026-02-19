# 🔥 Guide de Configuration Firebase pour Budget Tracker

Ce guide vous aidera à configurer Firebase Firestore pour synchroniser vos données entre plusieurs appareils.

## 📋 Prérequis

- Un compte Google
- Accès à la [Console Firebase](https://console.firebase.google.com/)

## 🚀 Étapes de Configuration

### 1. Créer un Projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"** (Add project)
3. Donnez un nom à votre projet, par exemple : `budget-tracker-perso`
4. (Optionnel) Désactivez Google Analytics si vous n'en avez pas besoin
5. Cliquez sur **"Créer le projet"**

### 2. Activer Firestore Database

1. Dans le menu de gauche, cliquez sur **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"** (Create database)
3. Choisissez **"Démarrer en mode test"** (Start in test mode) pour commencer
   - ⚠️ Attention : Les règles de test permettent l'accès à tous pendant 30 jours
   - Vous devrez les modifier plus tard (voir section Sécurité ci-dessous)
4. Sélectionnez une région proche de vous (par exemple : `europe-west1` pour l'Europe)
5. Cliquez sur **"Activer"**

### 3. Obtenir les Clés de Configuration

1. Cliquez sur l'icône d'engrenage ⚙️ à côté de "Vue d'ensemble du projet"
2. Sélectionnez **"Paramètres du projet"**
3. Faites défiler jusqu'à **"Vos applications"**
4. Cliquez sur l'icône Web **`</>`** pour ajouter une application Web
5. Donnez un nom à votre application (par exemple : `Budget Tracker Web`)
6. **Ne cochez PAS** "Configurer Firebase Hosting"
7. Cliquez sur **"Enregistrer l'application"**
8. Copiez l'objet `firebaseConfig` qui s'affiche

### 4. Configurer votre Application

1. Ouvrez le fichier `firebase-config.js` dans votre projet
2. Remplacez les valeurs placeholder par vos propres valeurs :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "budget-tracker-12345.firebaseapp.com",
  projectId: "budget-tracker-12345",
  storageBucket: "budget-tracker-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

3. Sauvegardez le fichier

### 5. Configurer les Règles de Sécurité Firestore

#### ⚠️ Règles de Base (Permissives - Pour Test Uniquement)

Dans la Console Firebase, allez dans **Firestore Database > Règles** et collez :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{profile}/{document=**} {
      // ⚠️ ATTENTION : Ces règles permettent l'accès à tous
      // À utiliser uniquement pour les tests
      allow read, write: if true;
    }
  }
}
```

#### 🔒 Règles Recommandées (Plus Sécurisées)

Pour une meilleure sécurité, ajoutez une authentification Firebase et utilisez ces règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{profile}/{document=**} {
      // Seuls les utilisateurs authentifiés peuvent accéder
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note** : L'application actuelle utilise des PINs côté client. Pour une vraie sécurité, il faudrait implémenter l'authentification Firebase (voir section Améliorations ci-dessous).

## ✅ Vérification

1. Ouvrez votre application Budget Tracker dans un navigateur
2. Ouvrez la Console du navigateur (F12)
3. Vous devriez voir : `✅ Firebase initialisé avec succès`
4. L'indicateur en haut à droite devrait afficher : `☁️ Synchronisé`
5. Ajoutez une transaction
6. Allez dans Firebase Console > Firestore Database
7. Vous devriez voir vos données dans la structure suivante :
   ```
   profiles/
   └── hemank/ (ou jullian/)
       └── transactions/
           └── [transaction-id]
   ```

## 🧪 Test de Synchronisation

1. Ouvrez l'application sur un premier appareil/navigateur
2. Ajoutez quelques transactions
3. Ouvrez l'application sur un second appareil/navigateur
4. Vous devriez voir les mêmes transactions apparaître automatiquement

## 🔧 Dépannage

### Problème : "Firebase non configuré, utilisation de localStorage"

**Solution** : Vérifiez que :
- Le fichier `firebase-config.js` contient vos vraies clés (pas les placeholders)
- Les scripts Firebase sont bien chargés dans `index.html`
- Vous n'avez pas d'erreur dans la Console du navigateur

### Problème : "Permission denied" dans Firestore

**Solution** :
1. Allez dans Firebase Console > Firestore Database > Règles
2. Vérifiez que les règles permettent l'accès (voir section Règles ci-dessus)
3. Si les règles de test ont expiré (après 30 jours), mettez-les à jour

### Problème : Les données ne se synchronisent pas

**Solution** :
1. Vérifiez votre connexion Internet
2. Ouvrez la Console du navigateur pour voir les erreurs
3. Vérifiez que Firebase est bien initialisé (message vert dans la console)
4. Vérifiez que les règles Firestore permettent l'accès

## 🎯 Améliorations Possibles

### 1. Authentification Firebase

Pour une vraie sécurité multi-utilisateurs :
- Activer Firebase Authentication
- Implémenter l'inscription/connexion
- Lier les profils aux comptes utilisateurs
- Mettre à jour les règles de sécurité Firestore

### 2. Synchronisation en Temps Réel

Ajouter des écouteurs Firestore pour la synchronisation en temps réel :

```javascript
db.collection('profiles')
  .doc(currentProfile)
  .collection('transactions')
  .onSnapshot((snapshot) => {
    // Mettre à jour l'interface en temps réel
  });
```

### 3. Mode Hors Ligne

Firebase Firestore supporte le mode hors ligne par défaut :

```javascript
firebase.firestore().enablePersistence()
  .catch((err) => {
    console.error('Erreur persistence:', err);
  });
```

## 📚 Ressources

- [Documentation Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Règles de Sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## ⚠️ Notes Importantes

1. **Ne partagez jamais vos clés Firebase publiquement** dans un dépôt public sans restrictions appropriées
2. Les **codes PIN** de l'application sont stockés côté client et ne sont **pas sécurisés** pour une utilisation en production
3. Les **règles Firestore de test** expirent après 30 jours - pensez à les mettre à jour
4. Pour une application en production, implémentez l'**authentification Firebase** appropriée

## 💾 Backup des Données

Même avec Firebase, l'application conserve un backup localStorage :
- Les données sont sauvegardées localement ET dans Firestore
- Si Firebase échoue, l'application fonctionne avec localStorage
- Vous pouvez toujours exporter vos données en Excel

---

**Besoin d'aide ?** Consultez la [documentation Firebase](https://firebase.google.com/docs) ou ouvrez une issue sur GitHub.

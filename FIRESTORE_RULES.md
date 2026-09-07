# Règles de sécurité Firestore

À coller dans Firebase Console → Firestore Database → onglet **Règles** → remplacer tout le contenu → **Publier**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update, delete: if false;
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;

      match /following/{targetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /accounts/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update: if request.auth != null && request.auth.uid in request.resource.data.memberIds;
      allow delete: if request.auth != null && resource.data.ownerId == request.auth.uid;

      match /messages/{messageId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds;
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds
          && request.resource.data.senderId == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}
```

**Ce que ça autorise :**
- Tout le monde peut lire les profils publics (`users`) et les groupes — nécessaire pour ajouter un ami par pseudo ou rejoindre un groupe par code.
- Chacun ne peut écrire que son propre profil et sa propre liste d'amis (`following`).
- Un groupe ne peut être créé que par son propriétaire, et seulement modifié par quelqu'un qui reste (ou devient) membre — empêche de vider un groupe à distance.
- Seuls les membres d'un groupe peuvent lire ou écrire dans sa discussion (`messages`), et uniquement en leur propre nom (`senderId` doit être toi) — personne ne peut lire ou écrire dans le chat d'un groupe auquel il n'appartient pas. Les messages ne peuvent pas être modifiés ni supprimés après coup.
- `accounts/{uid}` (email, essai gratuit, statut d'abonnement) n'est lisible et modifiable que par son propriétaire — contrairement à `users/{uid}` qui est public, ces informations sont privées.

**Si tu as déjà publié les règles précédentes**, il faut recoller ce bloc complet dans Firebase Console → Firestore Database → Règles → Publier, pour que la discussion de groupe fonctionne (sinon Firestore refusera silencieusement toute lecture/écriture dans `messages`).

# Journal de pannes — Défi 99

> Carnet de bord des bugs rencontrés en développant cette app. Objectif : ce qui a coincé une fois ne doit
> plus jamais coincer un futur Claude (ou toi). Inspiré du pattern "doctor journal" du toolkit La Recette.

## Comment ajouter une entrée (Claude, lis-moi)

- Ajoute en **HAUT** (la plus récente en premier), juste sous cette section, avec le gabarit ci-dessous.
- **Zéro secret** dans une entrée (masque toute clé/token si tu dois en citer une : `sk-***`).
- Sois concret et actionnable : le prochain Claude doit pouvoir appliquer le fix sans deviner ni relire
  toute la conversation.
- Un bug "escaladé" (pas résolu, laissé de côté) mérite quand même une entrée — au moins pour que le
  prochain passage ne reparte pas de zéro sur le diagnostic.

### Gabarit à copier

```
## [AAAA-MM-JJ] Titre court du symptôme

- **Symptôme :** …
- **Contexte :** <plateforme (web/iOS/Android) · fichier(s) concerné(s) · à quelle étape>
- **Cause réelle :** … (en une phrase simple)
- **Fix qui a marché :** … (étapes exactes)
- **Statut :** résolu ✅ / escaladé ⛔ (à reprendre)
```

---

<!-- Les nouvelles entrées vont ICI, la plus récente en premier. -->

## [2026-09-09] `expo export --output-dir docs` efface `docs/.nojekyll`

- **Symptôme :** après un rebuild web (`npx expo export --platform web --output-dir docs`), GitHub Pages
  sert une page blanche / 404 sur le bundle JS (`_expo/static/js/...`) une fois déployé.
- **Contexte :** web (déploiement GitHub Pages depuis `docs/` sur `main`), étape `expo export`.
- **Cause réelle :** `expo export` régénère tout le dossier `docs/` et ne recrée pas `docs/.nojekyll`. Sans
  ce fichier, GitHub Pages applique son traitement Jekyll par défaut, qui ignore les dossiers commençant
  par `_` — donc tout `_expo/*` (le bundle JS) n'est jamais servi. Déjà arrivé au moins 2 fois avant cette
  entrée (voir commits `78bd9eb` et `8c78ba5`).
- **Fix qui a marché :** juste après chaque `expo export --output-dir docs`, avant de commit/push :
  `touch docs/.nojekyll`. Vérifier avec `git status docs/` que `.nojekyll` n'apparaît pas comme supprimé.
- **Self-check :** `git status --porcelain docs/` ne doit montrer aucun `D docs/.nojekyll`.
- **Statut :** résolu ✅ (mais se reproduira à chaque export tant que ce n'est pas automatisé)
- **À promouvoir dans un script ?** oui — vu 3 fois maintenant, candidat pour un script `scripts/build-web.sh`
  qui fait `expo export` puis `touch docs/.nojekyll` en une seule commande, pour ne plus dépendre de la
  mémoire de qui déploie.

## [2026-09-08] Halo blanc autour de la barre de navigation en mode sombre

- **Symptôme :** en thème sombre, un halo/liseré blanc visible autour de la pastille flottante de la barre
  de navigation du bas, surtout autour de l'onglet actif (capsule surélevée).
- **Contexte :** web (PWA), composant de la barre de navigation du bas (effet "verre" translucide).
- **Cause réelle :** **pas** le focus ring du navigateur (2 diagnostics erronés avant de trouver) — c'était
  un liseré décoratif (bordure/box-shadow clair pensé pour le mode clair) qui croisait visuellement la
  capsule protubérante de l'onglet actif en mode sombre.
- **Fix qui a marché :** conditionner ce liseré au thème (le retirer ou l'assombrir en mode sombre) plutôt
  que de toucher au focus/outline — reproduire le bug en direct dans le navigateur (pas juste relire le
  code) a été nécessaire pour distinguer "liseré décoratif" de "focus ring".
- **Statut :** résolu ✅

## [2026-09-08] Avatar DiceBear non capturable dans la carte de partage (web)

- **Symptôme :** le bouton "Partager ma semaine" génère une carte image (dégradé, logo, stats) via
  `react-native-view-shot`, mais l'avatar DiceBear n'apparaît pas dans l'image exportée côté web.
- **Contexte :** web (PWA), `ShareCard.tsx` / génération d'image pour le récap hebdomadaire.
- **Cause réelle :** l'avatar DiceBear est chargé depuis l'API DiceBear (URL distante) ; un `<canvas>` web
  refuse de "lire" une image cross-origin sans en-têtes CORS adaptés — la capture via view-shot échoue
  silencieusement sur cette image précise.
- **Fix qui a marché :** recharger l'avatar en **data URI** (fetch + conversion base64) avant de le passer
  au composant capturé, plutôt que de garder l'URL distante — évite le problème CORS canvas.
- **Statut :** résolu ✅

## [2026-09-08] `expo run:ios` bloqué par une version Ruby/CocoaPods trop ancienne

- **Symptôme :** impossible de lancer un rechargement natif iOS en direct via `expo run:ios`.
- **Contexte :** macOS, build natif iOS (pas Expo Go), CocoaPods.
- **Cause réelle :** la version de Ruby/CocoaPods installée sur la machine est trop ancienne pour ce que
  demande le projet natif généré.
- **Fix qui a marché :** aucun encore — nécessite d'installer Homebrew côté utilisateur (pas quelque chose
  qu'un agent peut faire sans confirmation, ça touche l'environnement système). Explicitement mis de côté.
- **Statut :** escaladé ⛔ (à reprendre : demander à l'utilisateur d'installer Homebrew, puis `brew install
  ruby` / `gem install cocoapods` ou passer par `rbenv`)

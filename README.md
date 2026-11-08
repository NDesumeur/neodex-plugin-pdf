# NeoPDF

Un lecteur de PDF qui permet aussi de les annoter : stylo, surligneur, notes et gomme, avec recherche dans le texte. Tes annotations sont gardées pour chaque PDF, et tu peux enregistrer une copie annotée.

*English version: [README.en.md](README.en.md)*

## Ouvrir un PDF

- **Ouvrir un PDF**, ou glisse un fichier sur la page.
- Un PDF ouvert depuis un site web dans NeoDex s'affiche aussi dans NeoPDF.
- La liste **PDF récents** garde les 30 derniers, avec leur nombre de pages et d'annotations : **Ouvrir** pour un fichier du PC, **Sur le site** pour un PDF venu d'internet. Un PDF annoté reste dans la liste.
- Chaque PDF se rouvre à la page où tu l'avais laissé.

## Lire

- **Page précédente** et **suivante**, ou défilement à la souris.
- **Zoomer**, **Dézoomer** et **Largeur** (toute la largeur de la fenêtre).
- **Chercher dans le PDF** : la recherche de NeoDex (Ctrl+F) trouve aussi le texte des pages pas encore affichées.

## Annoter

Choisis un outil dans la barre :

- **Défiler** : l'outil de lecture, sans rien dessiner.
- **Stylo** : tracer à main levée.
- **Surligneur** : un trait large et transparent pour surligner.
- **Note** : clique pour poser une note à cet endroit de la page. Clique sur une note pour la modifier ; vide-la pour la supprimer.
- **Gomme** : clique sur un tracé pour l'effacer.

Six couleurs au choix : rouge, jaune, vert, bleu, violet et noir. **Annuler** retire le dernier tracé ou la dernière note.

## Enregistrer

- **Enregistrer le PDF** : une copie du PDF tel quel, utile pour garder un PDF lu sur un site.
- **Enregistrer annoté** : une copie du PDF avec tes tracés et tes notes dessinés dessus. Le fichier d'origine n'est pas modifié.

## Données et synchronisation

Tes annotations (tracés et notes) et la liste des PDF récents sont enregistrées par NeoDex, sauvegardées et synchronisées entre tes PC si la synchro est activée. Chaque PDF est reconnu à son contenu : il retrouve ses annotations même déplacé ou renommé. Au premier lancement, le plugin reprend ce que tu avais déjà dans NeoDex.

## Installer

Dans NeoDex : **NeoStore → À découvrir → NeoPDF → Installer**.

Développer un plugin : voir le [SDK NeoDex](https://github.com/NDesumeur/neodex-sdk).

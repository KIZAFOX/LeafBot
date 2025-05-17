module.exports = {
  name: 'help',
  description: 'Affiche la liste des commandes disponibles.',
  execute(message) {
    const helpMessage = `
**Liste des commandes :**
- **-lol** : Affiche ton profil League of Legends.
- **-valo** : Affiche ton profil Valorant.
- **-pray [ville]** : Affiche le lien vers les horaires de prière pour la ville spécifiée (ex : -pray paris).
- **-aboutme [pokemon|phrase|about] <valeur>** : Affiche ou modifie ton profil personnel (Pokémon, phrase ou description).
- **-card** : Affiche ta carte d'identité avec tes informations enregistrées.
    `;
    message.reply(helpMessage);
  },
};

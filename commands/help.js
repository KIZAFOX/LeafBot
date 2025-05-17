module.exports = {
  name: 'help',
  description: 'Affiche la liste des commandes disponibles.',
  async execute(message) {
    const helpMessage = getHelpMessage();
    await message.reply(helpMessage);
  },
};

function getHelpMessage() {
  const commands = [
    { cmd: '-lol', desc: 'Affiche ton profil League of Legends.' },
    { cmd: '-valo', desc: 'Affiche ton profil Valorant.' },
    { cmd: '-pray [ville]', desc: 'Affiche le lien vers les horaires de prière pour la ville spécifiée (ex : -pray paris).' },
    { cmd: '-aboutme [pokemon|phrase|about] <valeur>', desc: 'Affiche ou modifie ton profil personnel (Pokémon, phrase ou description).' },
    { cmd: '-card', desc: "Affiche ta carte d'identité avec tes informations enregistrées." },
  ];

  const lines = commands.map(c => `- **${c.cmd}** : ${c.desc}`);
  return `**Liste des commandes :**\n${lines.join('\n')}`;
}

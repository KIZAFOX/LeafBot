const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = './data/profiles.json';

module.exports = {
  name: 'card',
  description: 'Afficher la carte de profil de l\'utilisateur.',
  async execute(message, args) {
    try {
      const targetUser = message.mentions.users.first() || message.author;
      const userId = targetUser.id;

      let profiles = {};
      try {
        const data = await fs.readFile(path, 'utf8');
        profiles = JSON.parse(data);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier profiles:', error);
        profiles = {};
      }

      const userProfile = profiles[userId] || {};
      const favPokemon = userProfile.poke || 'Aucun pokémon définie';
      const phrase = userProfile.phrase || 'Aucune phrase définie';
      const aboutMe = userProfile.aboutme || 'Aucune description définie';

      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle(`${targetUser.username} - Carte de Profil`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Discord Name', value: targetUser.username, inline: true },
          { name: 'Tag Discord', value: targetUser.tag, inline: true },
          { name: 'ID Discord', value: targetUser.id, inline: true },
          { name: 'Pokémon Favori', value: favPokemon, inline: true },
          { name: 'Phrase', value: phrase, inline: false },
          { name: 'À propos de moi', value: aboutMe, inline: false }
        )

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la commande card:', error);
      await message.reply('Désolé, une erreur s\'est produite lors de l\'affichage de la carte de profil.');
    }
  }
};

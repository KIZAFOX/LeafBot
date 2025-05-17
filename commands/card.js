const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(process.cwd(), 'data', 'profiles.json');

module.exports = {
  name: 'card',
  description: 'Afficher la carte de profil de l\'utilisateur.',
  async execute(message, args) {
    try {
      const targetUser = message.mentions.users.first() || message.author;
      const userId = targetUser.id;

      let profiles = {};
      try {
        const data = await fs.readFile(dataPath, 'utf8');
        profiles = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Erreur lors de la lecture du fichier profiles:', error);
        }
        profiles = {};
      }

      const userProfile = profiles[userId] || {};
      const favPokemon = userProfile.poke || 'Aucun pokémon défini';
      const phrase = userProfile.phrase || 'Aucune phrase définie';
      const aboutMe = userProfile.aboutme || 'Aucune description définie';

      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle(`${targetUser.username} - Carte de Profil`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Discord Name', value: targetUser.username, inline: true },
          { name: 'Tag Discord', value: targetUser.tag, inline: true },
          { name: 'ID Discord', value: userId, inline: true },
          { name: 'Pokémon Favori', value: favPokemon, inline: true },
          { name: 'Phrase', value: phrase, inline: false },
          { name: 'À propos de moi', value: aboutMe, inline: false }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la commande card:', error);
      await message.reply('Désolé, une erreur est survenue lors de l\'affichage de ta carte de profil.');
    }
  }
};

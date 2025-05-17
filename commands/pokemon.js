const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pokemon',
  description: 'Affiche un Pokémon aléatoire avec ses infos.',
  async execute(message) {
    try {
      const randomId = Math.floor(Math.random() * 898) + 1;

      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      const data = response.data;

      const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
      const id = data.id;
      const types = data.types.map(t => t.type.name).join(', ');
      const height = data.height / 10;
      const weight = data.weight / 10;
      const sprite = data.sprites.front_default;

      const embed = new EmbedBuilder()
        .setTitle(`#${id} - ${name}`)
        .setColor('#FF0000')
        .setThumbnail(sprite)
        .addFields(
          { name: 'Types', value: types, inline: true },
          { name: 'Taille', value: `${height} m`, inline: true },
          { name: 'Poids', value: `${weight} kg`, inline: true }
        )
        .setFooter({ text: 'Données via PokéAPI' });

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur lors de la commande pokemon:', error);
      await message.reply('Une erreur est survenue lors de la récupération du Pokémon.');
    }
  }
};

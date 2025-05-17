const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const https = require('https');
const path = require('path');

const profilesPath = path.join(process.cwd(), 'data', 'profiles.json');

function checkPokemonExists(nameOrId) {
  return new Promise((resolve) => {
    const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`;
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

function getPokemonId(nameOrId) {
  return new Promise((resolve) => {
    const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.id);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function loadProfiles() {
  try {
    const data = await fs.readFile(profilesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(profilesPath, '{}');
      return {};
    }
    throw error;
  }
}

async function saveProfiles(profiles) {
  await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2));
}

module.exports = {
  name: 'aboutme',
  description: 'Affiche ou modifie ton profil personnel.',
  async execute(message, args) {
    try {
      const userId = message.author.id;
      const profiles = await loadProfiles();

      if (!profiles[userId]) {
        profiles[userId] = {
          poke: 'pikachu',
          phrase: 'Aucune phrase définie',
          aboutme: 'Aucune description définie.'
        };
      }

      if (args.length > 0) {
        const subcommand = args[0].toLowerCase();
        const content = args.slice(1).join(' ').trim();

        switch (subcommand) {
          case 'pokemon':
            if (!content) return message.reply('Merci d’indiquer un nom ou ID de Pokémon.');
            if (!(await checkPokemonExists(content))) {
              return message.reply('Pokémon introuvable. Vérifie l’orthographe ou l’ID (ex: `pikachu`, `25`).');
            }
            profiles[userId].poke = content.toLowerCase();
            break;

          case 'phrase':
            if (!content) return message.reply('Merci de fournir une phrase.');
            profiles[userId].phrase = content;
            break;

          case 'about':
            if (!content) return message.reply('Merci de fournir une description.');
            profiles[userId].aboutme = content;
            break;

          default:
            return message.reply('Commande invalide. Utilise `pokemon`, `phrase` ou `about`.');
        }

        await saveProfiles(profiles);

        const pokeId = await getPokemonId(profiles[userId].poke);

        const embed = new EmbedBuilder()
          .setColor('#FFAA00')
          .setTitle('Profil mis à jour !')
          .setDescription(`**Pokémon** : ${profiles[userId].poke}\n**Phrase** : ${profiles[userId].phrase}\n**À propos de moi** : ${profiles[userId].aboutme}`)
          .setThumbnail(pokeId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : null);

        return message.channel.send({ embeds: [embed] });
      }

      const userProfile = profiles[userId];
      const pokeId = await getPokemonId(userProfile.poke);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${message.author.username} - Profil`)
        .setDescription(`**Tag Discord** : ${message.author.tag}\n**ID** : ${message.author.id}\n**Pokémon Favori** : ${userProfile.poke}\n**Phrase** : ${userProfile.phrase}\n**À propos de moi** : ${userProfile.aboutme}`)
        .setThumbnail(pokeId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : null);

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur dans la commande aboutme:', error);
      await message.reply('Une erreur est survenue lors de la gestion de ton profil.');
    }
  }
};

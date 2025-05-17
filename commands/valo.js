const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const TRACKER_API_KEY = process.env.TRACKER_API_KEY;
if (!TRACKER_API_KEY) {
  console.error('La clé TRACKER_API_KEY est manquante dans .env');
  process.exit(1);
}

module.exports = {
  name: 'valo',
  description: 'Enregistre ton tag Valorant ou affiche ton profil',
  async execute(message, args) {
    const dataPath = path.join(process.cwd(), 'data', 'tags.json');

    async function readTags() {
      try {
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
      }
    }

    async function writeTags(tags) {
      await fs.writeFile(dataPath, JSON.stringify(tags, null, 2), 'utf8');
    }

    if (args.length > 0 && args.join(' ').includes('#')) {
      const userTag = args.join('').trim();

      if (!userTag.includes('#')) {
        return message.reply('Le tag doit contenir un #. Exemple : `-valo Nom#1234`');
      }

      try {
        const tags = await readTags();
        if (!tags[message.author.id]) tags[message.author.id] = {};
        tags[message.author.id].valo = userTag;
        await writeTags(tags);
        return message.reply(`✅ Ton tag Valorant a bien été enregistré : **${userTag}**`);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du tag Valorant :', error);
        return message.reply('❌ Une erreur est survenue lors de l\'enregistrement.');
      }
    }

    try {
      const tags = await readTags();
      const targetUser = message.mentions.users.first() || message.author;
      const userTag = tags[targetUser.id]?.valo;

      if (!userTag || !userTag.includes('#')) {
        return message.reply(`${targetUser.username} n'a pas encore de tag Valorant enregistré. Utilise \`-valo Nom#1234\` pour l'enregistrer.`);
      }

      const [riotName, tagLine] = userTag.split('#');
      const encodedTag = encodeURIComponent(`${riotName}#${tagLine}`);

      const headers = {
        'TRN-Api-Key': TRACKER_API_KEY,
        'Accept': 'application/json',
      };

      const response = await fetch(`https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${encodedTag}`, { headers });

      if (!response.ok) {
        if (response.status === 404) return message.reply('Profil Valorant introuvable. Vérifie ton tag et réessaie.');
        throw new Error(`Erreur API Tracker.gg : ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const overview = data.data.segments.find(s => s.type === 'overview');
      if (!overview) return message.reply('Impossible de trouver les statistiques du profil.');

      const stats = overview.stats || {};
      const rankMeta = stats.rank?.metadata || {};

      const embed = new EmbedBuilder()
        .setColor('#FA4454')
        .setTitle(`${targetUser.username} - Profil Valorant`)
        .setDescription(
          `**Tag** : ${riotName}#${tagLine}\n` +
          `**ELO** : ${stats.elo?.displayValue ?? 'Inconnu'}\n` +
          `**K/D** : ${stats.kd?.displayValue ?? '0'}\n` +
          `**Victoires** : ${stats.wins?.displayValue ?? '0'}\n` +
          `**Rang** : ${rankMeta.tierName ?? 'Non classé'}`
        )
        .setFooter({ text: 'Données via Tracker.gg', iconURL: message.client.user.displayAvatarURL() })
        .setTimestamp()
        .setURL(`https://tracker.gg/valorant/profile/riot/${riotName}-${tagLine}/overview`);

      if (rankMeta.iconUrl) embed.setThumbnail(rankMeta.iconUrl);

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur lors de l\'affichage du profil Valorant :', error);
      return message.reply('❌ Impossible de récupérer le profil Valorant pour le moment.');
    }
  },
};

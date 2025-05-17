const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const dotenv = require('dotenv');

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

module.exports = {
  name: 'lol',
  description: 'Enregistre ou affiche ton profil LoL (tag, niveau et ELO).',
  async execute(message, args) {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'tags.json');
      let tagsData = {};

      try {
        const data = await fs.readFile(dataPath, 'utf8');
        tagsData = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      if (args[0]) {
        const tag = args.join(' ');
        if (!tag.includes('#')) {
          return message.reply('Le tag doit contenir un `#`. Exemple: `-lol Nom#1234`');
        }

        if (!tagsData[message.author.id]) tagsData[message.author.id] = {};
        tagsData[message.author.id].lol = tag;

        await fs.mkdir(path.dirname(dataPath), { recursive: true });
        await fs.writeFile(dataPath, JSON.stringify(tagsData, null, 2));

        return message.reply(`Votre tag LoL a été enregistré/mis à jour : ${tag}`);
      }

      const userTag = tagsData[message.author.id]?.lol;
      if (!userTag || !userTag.includes('#')) {
        return message.reply("Vous n'avez pas encore enregistré de tag LoL. Utilisez `-lol VotreTag#1234`.");
      }

      const [riotName, tagLine] = userTag.split('#');
      const headers = { 'X-Riot-Token': RIOT_API_KEY };

      const accountRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${riotName}/${tagLine}`, { headers });
      if (!accountRes.ok) throw new Error(`Riot ID invalide : ${accountRes.status}`);
      const accountData = await accountRes.json();
      const puuid = accountData.puuid;

      const summonerRes = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, { headers });
      if (!summonerRes.ok) throw new Error(`Erreur récupération Summoner : ${summonerRes.status}`);
      const summonerData = await summonerRes.json();

      const rankedRes = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`, { headers });
      if (!rankedRes.ok) throw new Error(`Erreur récupération League : ${rankedRes.status}`);
      const rankedData = await rankedRes.json();

      let eloSolo = 'Unranked';
      let eloFlex = 'Unranked';

      for (const queue of rankedData) {
        const str = `${queue.tier} ${queue.rank} (${queue.leaguePoints} LP)`;
        if (queue.queueType === 'RANKED_SOLO_5x5') eloSolo = str;
        else if (queue.queueType === 'RANKED_FLEX_SR') eloFlex = str;
      }

      const formattedTag = userTag.replace('#', '-');
      const opggUrl = `https://www.op.gg/summoners/euw/${encodeURIComponent(formattedTag)}`;
      const embed = new EmbedBuilder()
        .setColor('#0AC8B9')
        .setTitle(`${message.author.username}'s LoL Profile`)
        .setURL(opggUrl)
        .setDescription(`**Pseudo LoL** : ${riotName}#${tagLine}\n**Niveau** : ${summonerData.summonerLevel}\n\n**SoloQ** : ${eloSolo}\n**Flex** : ${eloFlex}\n\n**OP.GG** : ${opggUrl}`)
        .setFooter({ text: 'Données Riot Games + OP.GG', iconURL: message.client.user.displayAvatarURL() })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur commande -lol:', error);
      await message.reply("Erreur lors de l'exécution de la commande. Vérifie ton tag ou réessaie plus tard.");
    }
  }
};

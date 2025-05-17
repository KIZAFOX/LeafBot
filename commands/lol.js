const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const dotenv = require('dotenv');

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const DATA_PATH = path.join(process.cwd(), 'data', 'tags.json');

async function readTags() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

async function writeTags(tags) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(tags, null, 2));
}

async function fetchRiotAPI(url) {
  const res = await fetch(url, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erreur API Riot (${res.status}): ${errText}`);
  }
  return res.json();
}

function formatElo(rankedData) {
  let eloSolo = 'Unranked';
  let eloFlex = 'Unranked';

  for (const queue of rankedData) {
    const eloString = `${queue.tier} ${queue.rank} (${queue.leaguePoints} LP)`;
    if (queue.queueType === 'RANKED_SOLO_5x5') eloSolo = eloString;
    else if (queue.queueType === 'RANKED_FLEX_SR') eloFlex = eloString;
  }

  return { eloSolo, eloFlex };
}

module.exports = {
  name: 'lol',
  description: 'Enregistre ou affiche ton profil LoL (tag, niveau et ELO).',
  async execute(message, args) {
    try {
      const tagsData = await readTags();

      // Si l'utilisateur donne un argument, on enregistre/mets à jour son tag
      if (args.length) {
        const tag = args.join(' ');
        if (!tag.includes('#')) {
          return await message.reply('Le tag doit contenir un `#`. Exemple: `-lol Nom#1234`');
        }

        tagsData[message.author.id] = { ...tagsData[message.author.id], lol: tag };
        await writeTags(tagsData);
        return await message.reply(`Votre tag LoL a été enregistré/mis à jour : ${tag}`);
      }

      const userTag = tagsData[message.author.id]?.lol;
      if (!userTag || !userTag.includes('#')) {
        return await message.reply("Vous n'avez pas encore enregistré de tag LoL. Utilisez `-lol VotreTag#1234`.");
      }

      const [riotName, tagLine] = userTag.split('#');

      const accountData = await fetchRiotAPI(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${riotName}/${tagLine}`);
      const puuid = accountData.puuid;

      const summonerData = await fetchRiotAPI(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`);
      const rankedData = await fetchRiotAPI(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`);

      const { eloSolo, eloFlex } = formatElo(rankedData);

      const formattedTag = userTag.replace('#', '-');
      const opggUrl = `https://www.op.gg/summoners/euw/${encodeURIComponent(formattedTag)}`;

      const embed = new EmbedBuilder()
        .setColor('#0AC8B9')
        .setTitle(`${message.author.username}'s LoL Profile`)
        .setURL(opggUrl)
        .setDescription(
          `**Pseudo LoL** : ${riotName}#${tagLine}\n` +
          `**Niveau** : ${summonerData.summonerLevel}\n\n` +
          `**SoloQ** : ${eloSolo}\n` +
          `**Flex** : ${eloFlex}\n\n` +
          `**OP.GG** : [Lien](${opggUrl})`
        )
        .setFooter({ text: 'Données Riot Games + OP.GG', iconURL: message.client.user.displayAvatarURL() })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur commande -lol:', error);
      await message.reply("Erreur lors de l'exécution de la commande. Vérifie ton tag ou réessaie plus tard.");
    }
  }
};

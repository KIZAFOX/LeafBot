const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const dotenv = require('dotenv');

dotenv.config();

const TRACKER_API_KEY = process.env.TRACKER_API_KEY;

module.exports = {
    name: 'valo',
    description: 'Enregistre ton tag Valorant ou affiche ton profil',
    async execute(message, args) {
        const dataPath = path.join(process.cwd(), 'data', 'tags.json');

        if (args.length >= 1 && args.join(' ').includes('#')) {
            const userTag = args.join(' ').replace(/\s+/g, '');

            if (!userTag.includes('#')) {
                return message.reply('Le tag doit contenir un #. Exemple: -valo Nom#1234');
            }

            try {
                let tagsData = {};
                try {
                    const data = await fs.readFile(dataPath, 'utf8');
                    tagsData = JSON.parse(data);
                } catch (error) {
                    if (error.code !== 'ENOENT') throw error;
                }

                if (!tagsData[message.author.id]) {
                    tagsData[message.author.id] = {};
                }
                tagsData[message.author.id].valo = userTag;

                await fs.writeFile(dataPath, JSON.stringify(tagsData, null, 2), 'utf8');
                await message.reply(`✅ Ton tag Valorant a bien été enregistré : **${userTag}**`);
                return;

            } catch (error) {
                console.error('Erreur enregistrement tag Valorant:', error);
                return message.reply('❌ Une erreur est survenue lors de l\'enregistrement.');
            }
        }

        try {
            let tagsData = {};
            try {
                const data = await fs.readFile(dataPath, 'utf8');
                tagsData = JSON.parse(data);
            } catch (err) {
                if (err.code === 'ENOENT') return message.reply("📂 Le fichier des tags est vide.");
                throw err;
            }

            const targetUser = message.mentions.users.first() || message.author;
            const userTag = tagsData[targetUser.id]?.valo;

            if (!userTag || !userTag.includes('#')) {
                return message.reply(`${targetUser.username} n'a pas encore de tag enregistré. Utilise \`-valo Nom#1234\``);
            }

            const [riotName, tagLine] = userTag.split('#');
            const encodedTag = encodeURIComponent(`${riotName}#${tagLine}`);
            const headers = {
                'TRN-Api-Key': TRACKER_API_KEY,
                'Accept': 'application/json'
            };

            const res = await fetch(`https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${encodedTag}`, { headers });
            if (!res.ok) throw new Error(`Erreur Tracker.gg : ${res.status}`);
            const data = await res.json();

            const stats = data.data.segments.find(s => s.type === 'overview')?.stats;
            const rankName = stats?.rank.metadata.tierName || 'Non classé';
            const rankIcon = stats?.rank.metadata.iconUrl;
            const elo = stats?.elo?.displayValue || 'Inconnu';
            const wins = stats?.wins?.displayValue || '0';
            const kd = stats?.kd?.displayValue || '0';

            const embed = new EmbedBuilder()
                .setColor('#FA4454')
                .setTitle(`${targetUser.username}'s Valorant Profile`)
                .setDescription(`**Tag** : ${riotName}#${tagLine}\n**ELO** : ${elo}\n**K/D** : ${kd}\n**Victoires** : ${wins}\n**Rang** : ${rankName}`)
                .setFooter({ text: 'Données via Tracker.gg', iconURL: message.client.user.displayAvatarURL() })
                .setTimestamp()
                .setURL(`https://tracker.gg/valorant/profile/riot/${riotName}-${tagLine}/overview`);

            if (rankIcon) embed.setThumbnail(rankIcon);

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur affichage profil Valorant:', error);
            return message.reply('❌ Impossible de récupérer le profil Valorant.');
        }
    },
};

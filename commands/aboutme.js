const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const https = require('https');
const path = 'data/profiles.json';

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

module.exports = {
    name: 'aboutme',
    description: 'Affiche ou modifie ton profil personnel.',
    async execute(message, args) {
        const userId = message.author.id;

        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, '{}');
        }

        let profiles = JSON.parse(fs.readFileSync(path, 'utf8'));

        if (!profiles[userId]) {
            profiles[userId] = {
                "poke": "pikachu",
                "phrase": "Aucune phrase définie",
                "aboutme": "Aucune description définie."
            };
        }

        if (args.length > 0) {
            const subcommand = args[0].toLowerCase();
            const content = args.slice(1).join(' ');

            if (subcommand === 'pokemon') {
                if (!content) return message.reply('Merci d’indiquer un nom ou ID de Pokémon.');
                const exists = await checkPokemonExists(content);
                if (!exists) {
                    return message.reply('Pokémon introuvable. Vérifie l’orthographe ou l’ID (ex: `pikachu`, `25`).');
                }
                profiles[userId].poke = content.toLowerCase();
            } else if (subcommand === 'phrase') {
                if (!content) return message.reply('Merci de fournir une phrase.');
                profiles[userId].phrase = content;
            } else if (subcommand === 'about') {
                if (!content) return message.reply('Merci de fournir une description.');
                profiles[userId].aboutme = content;
            } else {
                return message.reply('Commande invalide. Utilise `pokemon`, `phrase` ou `aboutme`.');
            }

            fs.writeFileSync(path, JSON.stringify(profiles, null, 2));

            const pokeId = await getPokemonId(profiles[userId].poke);

            const embed = new EmbedBuilder()
                .setColor('#FFAA00')
                .setTitle('Profil mis à jour!')
                .setDescription(`**Pokémon**: ${profiles[userId].poke}\n**Phrase**: ${profiles[userId].phrase}\n**À propos de moi**: ${profiles[userId].aboutme}`)
                .setThumbnail(pokeId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : null);

            return message.channel.send({ embeds: [embed] });
        }

        const userProfile = profiles[userId];
        const pokeId = await getPokemonId(userProfile.poke);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`${message.author.username}'s Profil`)
            .setDescription(`**Tag Discord**: ${message.author.tag}\n**ID**: ${message.author.id}\n**Pokémon Favori**: ${userProfile.poke}\n**Phrase**: ${userProfile.phrase}\n**À propos de moi**: ${userProfile.aboutme}`)
            .setThumbnail(pokeId ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png` : null);

        message.channel.send({ embeds: [embed] });
    }
};

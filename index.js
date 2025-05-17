const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const prefix = process.env.DISCORD_APP_PREFIX;
if (!prefix) {
    console.error('Le préfixe DISCORD_APP_PREFIX est manquant dans .env');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const commandPath = path.join(commandsPath, file);
    const command = require(commandPath);

    if (typeof command.name === 'string' && typeof command.execute === 'function') {
        client.commands.set(command.name, command);
        console.log(`Commande chargée : ${command.name}`);
    } else {
        console.warn(`[ATTENTION] La commande dans ${file} est mal formatée (manque "name" ou "execute")`);
    }
}

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    console.log(`Préfixe utilisé : ${prefix}`);
    console.log(`Nombre de commandes chargées : ${client.commands.size}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la commande "${commandName}":`, error);
        try {
            await message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
        } catch (replyError) {
            console.error('Erreur lors de l\'envoi du message d\'erreur:', replyError);
        }
    }
});

process.on('unhandledRejection', error => {
    console.error('Erreur non gérée:', error);
});

const token = process.env.DISCORD_APP_TOKEN;
if (!token) {
    console.error('Le token DISCORD_APP_TOKEN est manquant dans .env');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('Erreur lors de la connexion du bot:', error);
    process.exit(1);
});

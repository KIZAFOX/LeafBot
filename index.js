const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const prefix = process.env.DISCORD_APP_PREFIX;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        console.log(`Commande chargée: ${command.name}`);
    } else {
        console.log(`[ATTENTION] La commande dans ${file} n'a pas les propriétés "name" ou "execute" requises.`);
    }
}

client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}!`);
    console.log(`Préfixe: ${prefix}`);
    console.log(`Nombre de commandes chargées: ${client.commands.size}`);
});

client.removeAllListeners('messageCreate');

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la commande:`, error);
        try {
            await message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
        } catch (e) {
            console.error('Erreur lors de l\'envoi du message d\'erreur:', e);
        }
    }
});

process.on('unhandledRejection', error => {
    console.error('Erreur non gérée:', error);
});

client.login(process.env.DISCORD_APP_TOKEN).catch(error => {
    console.error('Erreur lors de la connexion:', error);
    process.exit(1);
});
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    console.log('=== New Message ===');
    console.log('Author:', message.author?.username, 'Bot:', message.author?.bot);
    console.log('Webhook ID:', message.webhookId);
    console.log('Channel:', message.channel.id);
    console.log('Content:', message.content?.substring(0, 100));
    console.log('=================');
});

client.login('YOUR_BOT_TOKEN_HERE'); // TODO: Replace with actual token

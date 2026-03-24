/**
 * HKDSE Discord Bot
 * Listens for verified question exports and automatically updates the topic page
 * 
 * Setup:
 * 1. Create Discord Bot at https://discord.com/developers/applications
 * 2. Enable Message Content Intent
 * 3. Generate and copy bot token
 * 4. Run: DISCORD_TOKEN=your_token node discord-bot.js
 */

const { Client, GatewayIntentBits, Attachment } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Configuration
const CHANNEL_ID = '1485659955993382952'; // 考試專頁
const WORKSPACE = '/Users/zachli/ai-learning';
const TOPIC_PAGE = path.join(WORKSPACE, 'hkdse/pages/topic-probability.html');
const VERIFIED_FILE = path.join(WORKSPACE, 'hkdse/ocr-output/verified_probability.json');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`✅ HKDSE Bot 已登入為 ${client.user.tag}`);
    console.log(`📡 監聽頻道: ${CHANNEL_ID}`);
});

client.on('messageCreate', async (message) => {
    // Ignore regular bots, but process webhook messages (they appear as bot:true but have webhookId)
    if (message.author.bot && !message.webhookId) return;
    
    // Only process messages in the target channel
    if (message.channel.id !== CHANNEL_ID) return;
    
    console.log(`📩 收到消息: ${message.content}`);
    
    // Look for attachments
    if (message.attachments && message.attachments.size > 0) {
        for (const [id, attachment] of message.attachments) {
            if (attachment.name.endsWith('.json')) {
                console.log(`📎 找到 JSON 附件: ${attachment.name}`);
                await processAttachment(attachment, message);
            }
        }
    }
});

async function processAttachment(attachment, message) {
    try {
        // Download the JSON file
        const jsonContent = await downloadFile(attachment.url);
        const data = JSON.parse(jsonContent);
        
        if (data.questions && Array.isArray(data.questions)) {
            console.log(`📝 找到 ${data.questions.length} 題已確認題目`);
            
            // Save to verified file
            fs.writeFileSync(VERIFIED_FILE, JSON.stringify(data, null, 2));
            console.log('💾 已保存到:', VERIFIED_FILE);
            
            // Update topic page
            updateTopicPage(data.questions);
            
            // Commit and push
            const success = commitAndPush(data);
            
            if (success) {
                // Notify in Discord
                await message.reply(`✅ 已自動更新課題頁面！\n📚 ${data.questions.length} 題已確認\n🔗 https://ai-lish.github.io/ai-learning/hkdse/pages/topic-probability.html`);
                console.log('✅ 更新完成並已通知用戶');
            }
        }
    } catch (e) {
        console.error('❌ 處理失敗:', e.message);
        await message.reply(`❌ 自動更新失敗: ${e.message}`);
    }
}

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, { headers: { 'User-Agent': 'HKDSE-Bot/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function updateTopicPage(questions) {
    try {
        let html = fs.readFileSync(TOPIC_PAGE, 'utf8');
        
        // Update questions array
        const questionsJson = JSON.stringify(questions, null, 2);
        const dataRegex = /const questions = \[[\s\S]*?\];/;
        const newData = `const questions = ${questionsJson};`;
        
        if (dataRegex.test(html)) {
            html = html.replace(dataRegex, newData);
        }
        
        // Update total count
        const countMatch = /id="questionCount">[^<]*<\/span>/;
        const newCount = `id="questionCount">已確認題目: ${questions.length} 題</span>`;
        html = html.replace(countMatch, newCount);
        
        fs.writeFileSync(TOPIC_PAGE, html);
        console.log('📄 已更新課題頁面');
    } catch (e) {
        console.error('更新課題頁面失敗:', e.message);
    }
}

function commitAndPush(data) {
    try {
        const commitMsg = `Auto-update: ${data.questions.length} verified questions from Discord (${new Date().toLocaleString('zh-HK')})`;
        execSync('cd ' + WORKSPACE + ' && git add hkdse/pages/topic-probability.html hkdse/ocr-output/verified_probability.json && git commit -m "' + commitMsg + '" && git push', { encoding: 'utf8' });
        console.log('🚀 已推送至 GitHub');
        return true;
    } catch (e) {
        console.error('Git 推送失敗:', e.message);
        return false;
    }
}

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ 請設置 DISCORD_TOKEN 環境變量');
    console.log('   執行: DISCORD_TOKEN=your_token node discord-bot.js');
    process.exit(1);
}

console.log('🔑 正在登入 Discord...');
client.login(token);

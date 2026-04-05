#!/usr/bin/env node
/**
 * HKDSE Topic Page Updater
 * 
 * This script is triggered when verified questions are sent to Discord.
 * It:
 * 1. Fetches the latest messages from the webhook channel
 * 2. Finds JSON attachments with verified questions
 * 3. Updates the topic page
 * 4. Commits and pushes to GitHub
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Webhook info (from stored file)
const WEBHOOK_ID = '1485843120439693352';
const WEBHOOK_TOKEN = 'AMZ01WBD1f2x6zwu-gx6vC7snzkmY-WaE4AbzsLMmg2um_5wGNA9QvgaRXTb6BTRIZD5';
const CHANNEL_ID = '1485659955993382952';

// Paths
const WORKSPACE = '/Users/zachli/ai-learning';
const TOPIC_PAGE = path.join(WORKSPACE, 'hkdse/pages/topic-probability.html');
const VERIFIED_FILE = path.join(WORKSPACE, 'hkdse/ocr-output/verified_probability.json');

async function fetchWebhookMessages() {
    return new Promise((resolve, reject) => {
        const url = `https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}/messages?limit=10`;
        https.get(url, { headers: { 'User-Agent': 'HKDSE-Updater/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function downloadAttachment(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'HKDSE-Updater/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function updateTopicPage(questions, topic = 'probability') {
    // Load existing topic page
    let html = fs.readFileSync(TOPIC_PAGE, 'utf8');
    
    // Create questions array for the page
    const questionsJson = JSON.stringify(questions, null, 2);
    
    // Update the embedded questions data in the HTML
    const dataRegex = /const questions = \[[\s\S]*?\];/;
    const newData = `const questions = ${questionsJson};`;
    
    if (dataRegex.test(html)) {
        html = html.replace(dataRegex, newData);
    } else {
        console.log('Questions data pattern not found in HTML, updating question count...');
    }
    
    // Update total count
    const countMatch = /id="questionCount">[^<]*<\/span>/;
    const newCount = `id="questionCount">已確認題目: ${questions.length} 題</span>`;
    html = html.replace(countMatch, newCount);
    
    fs.writeFileSync(TOPIC_PAGE, html);
    console.log(`Updated topic page with ${questions.length} questions`);
}

function commitAndPush(message) {
    try {
        execSync('cd ' + WORKSPACE + ' && git add hkdse/pages/topic-probability.html && git commit -m "' + message + '" && git push', { encoding: 'utf8' });
        console.log('Committed and pushed successfully');
        return true;
    } catch (e) {
        console.error('Git error:', e.message);
        return false;
    }
}

async function main() {
    console.log('Checking for new verified questions...');
    
    try {
        const messages = await fetchWebhookMessages();
        
        if (!Array.isArray(messages) || messages.length === 0) {
            console.log('No messages found');
            return;
        }
        
        // Find messages with JSON attachments
        for (const msg of messages) {
            if (msg.content && msg.content.includes('HKDSE 題目更新請求')) {
                console.log('Found HKDSE update request from:', msg.timestamp);
                
                // Look for attachments
                if (msg.attachments && msg.attachments.size > 0) {
                    for (const attachment of msg.attachments.values()) {
                        if (attachment.filename.endsWith('.json')) {
                            console.log('Downloading:', attachment.filename);
                            const jsonData = await downloadAttachment(attachment.url);
                            const data = JSON.parse(jsonData);
                            
                            if (data.questions && Array.isArray(data.questions)) {
                                console.log(`Found ${data.questions.length} verified questions`);
                                
                                // Save to verified file
                                fs.writeFileSync(VERIFIED_FILE, JSON.stringify(data, null, 2));
                                
                                // Update topic page
                                updateTopicPage(data.questions, data.topic);
                                
                                // Commit and push
                                const success = commitAndPush(`Update verified questions: ${data.questions.length} new from Discord`);
                                
                                if (success) {
                                    console.log('✅ Topic page updated successfully!');
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();

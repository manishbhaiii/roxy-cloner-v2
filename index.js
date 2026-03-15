const origLog = console.log;
console.log = () => { };
require('dotenv').config();
console.log = origLog;

process.removeAllListeners('warning');

const { Client: BotClient, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Client: UserClient } = require('discord.js-selfbot-v13');

const bot = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const userClient = new UserClient({
    checkUpdate: false
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const DC_TOKEN = process.env.DC_TOKEN;
const ALLOWED_ID = process.env.ALLOWED_ID;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const purple = '\x1b[35m';
const reset = '\x1b[0m';

console.clear();
console.log(purple + `
 ██████╗  ██████╗ ██╗  ██╗██╗   ██╗     ██████╗██╗      ██████╗ ███╗   ██╗███████╗██████╗ 
 ██╔══██╗██╔═══██╗╚██╗██╔╝╚██╗ ██╔╝    ██╔════╝██║     ██╔═══██╗████╗  ██║██╔════╝██╔══██╗
 ██████╔╝██║   ██║ ╚███╔╝  ╚████╔╝     ██║     ██║     ██║   ██║██╔██╗ ██║█████╗  ██████╔╝
 ██╔══██╗██║   ██║ ██╔██╗   ╚██╔╝      ██║     ██║     ██║   ██║██║╚██╗██║██╔══╝  ██╔══██╗
 ██║  ██║╚██████╔╝██╔╝ ██╗   ██║       ╚██████╗███████╗╚██████╔╝██║ ╚████║███████╗██║  ██║
 ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝        ╚═════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
` + reset);

bot.once('ready', () => {
    console.log(purple + `Bot logged in as ${bot.user.tag}` + reset);
});

userClient.once('ready', () => {
    console.log(purple + `User Client logged in as ${userClient.user.tag}` + reset);
});

bot.on('messageCreate', async (message) => {
    if (message.author.bot || message.author.id !== ALLOWED_ID) return;

    if (message.content.startsWith('!clone')) {
        const args = message.content.split(' ');
        if (args.length < 3) {
            return message.reply("Usage: !clone <source_server_id> <target_server_id>");
        }

        const sourceId = args[1];
        const targetId = args[2];

        if (sourceId === targetId) {
            return message.reply("Source and Target server IDs cannot be the same.");
        }

        const sourceGuild = userClient.guilds.cache.get(sourceId);
        if (!sourceGuild) {
            return message.reply("I can't access the source server from the user account. Make sure the user account is in that server.");
        }

        const targetGuild = bot.guilds.cache.get(targetId);
        if (!targetGuild) {
            return message.reply("The bot is not in the target server.");
        }

        const botMember = await targetGuild.members.fetch(bot.user.id);
        if (!botMember.permissions.has('Administrator')) {
            return message.reply("The bot does not have Administrator permission in the target server. Please grant Administrator permission to the bot role.");
        }

        const highestRolePos = Math.max(...targetGuild.roles.cache.map(r => r.position));
        if (botMember.roles.highest.position < highestRolePos) {
            return message.reply("The bot's role is not at the top of the role list. Please go to Server Settings -> Roles, and drag the bot's role to the very top.");
        }

        const embed = new EmbedBuilder()
            .setTitle("Roxy Cloner V2 Setup")
            .setDescription(`Cloning from **${sourceGuild.name}** to **${targetGuild.name}**\n\n` +
                `**1.** Delete Existing Channels\n` +
                `**2.** Delete Existing Roles\n` +
                `**3.** Delete Emojis\n` +
                `**4.** Clone Channels\n` +
                `**5.** Clone Roles\n` +
                `**6.** Clone Emojis`)
            .setColor('#800080');

        let options = {
            1: false,
            2: false,
            3: false,
            4: false,
            5: false,
            6: false
        };

        const createRow = (startIndex, endIndex) => {
            const row = new ActionRowBuilder();
            for (let i = startIndex; i <= endIndex; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`opt_${i}`)
                        .setLabel(`${i}`)
                        .setStyle(options[i] ? ButtonStyle.Success : ButtonStyle.Danger)
                );
            }
            return row;
        };

        const row1 = createRow(1, 4);
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('opt_5')
                    .setLabel('5')
                    .setStyle(options[5] ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('opt_6')
                    .setLabel('6')
                    .setStyle(options[6] ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('start_clone')
                    .setLabel('Start Cloning')
                    .setStyle(ButtonStyle.Primary)
            );

        const replyMsgs = await message.channel.send({ embeds: [embed], components: [row1, row2] });

        const collector = replyMsgs.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.customId.startsWith('opt_')) {
                const optNum = parseInt(i.customId.split('_')[1]);
                options[optNum] = !options[optNum];

                const newRow1 = createRow(1, 4);
                const newRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('opt_5')
                            .setLabel('5')
                            .setStyle(options[5] ? ButtonStyle.Success : ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('opt_6')
                            .setLabel('6')
                            .setStyle(options[6] ? ButtonStyle.Success : ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('start_clone')
                            .setLabel('Start Cloning')
                            .setStyle(ButtonStyle.Primary)
                    );

                await i.update({ components: [newRow1, newRow2] });
            } else if (i.customId === 'start_clone') {
                collector.stop('started');
                await i.update({ components: [] });
                await message.channel.send("Starting cloning process in 3 seconds...");
                await delay(3000);
                startCloningProcess(message, sourceGuild, targetGuild, options);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'started') {
                replyMsgs.edit({ content: "Cloning menu timed out.", components: [] }).catch(() => { });
            }
        });
    }
});

async function startCloningProcess(message, sourceGuild, targetGuild, opts) {
    let logChannelId = message.channel.id;
    let logGuildId = message.guild?.id;

    async function sendLog(text) {
        try {
            const currentChannel = bot.channels.cache.get(logChannelId);
            if (logGuildId === targetGuild.id && opts[1]) {
                if (currentChannel) {
                    await currentChannel.send({ content: text }).catch(() => { });
                } else {
                    await message.author.send(`[Cloning Log] ${text}`).catch(() => { });
                }
            } else {
                if (currentChannel) {
                    await currentChannel.send({ content: text }).catch(() => { });
                } else {
                    await message.author.send(`[Cloning Log] ${text}`).catch(() => { });
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    await sendLog("Starting deletion process...");

    if (opts[1]) {
        const channels = targetGuild.channels.cache.filter(ch => ch.deletable);
        for (const [id, channel] of channels) {
            try {
                if (channel.id === logChannelId) continue;
                await channel.delete();
                await delay(1500);
            } catch { }
        }
        if (channels.has(logChannelId)) {
            const currentChannel = bot.channels.cache.get(logChannelId);
            if (currentChannel && currentChannel.deletable) {
                await message.author.send("Channel deleted. Continuing logs here...").catch(() => { });
                await currentChannel.delete().catch(() => { });
            }
        }
    }

    if (opts[2]) {
        const roles = targetGuild.roles.cache.filter(role => role.name !== '@everyone' && !role.managed && role.editable);
        for (const [id, role] of roles) {
            try {
                await role.delete();
                await delay(1500);
            } catch { }
        }
    }

    if (opts[3]) {
        const emojis = targetGuild.emojis.cache.filter(e => e.deletable);
        for (const [id, emoji] of emojis) {
            try {
                await emoji.delete();
                await delay(1500);
            } catch { }
        }
    }

    await sendLog("Cleanup complete. Starting cloning...");

    const roleMapping = new Map();

    if (opts[5]) {
        const targetEveryone = targetGuild.roles.everyone;
        const sourceEveryone = sourceGuild.roles.everyone;
        if (targetEveryone && sourceEveryone) {
            roleMapping.set(sourceEveryone.id, targetEveryone.id);
        }

        const rolesToClone = Array.from(sourceGuild.roles.cache.values())
            .filter(role => role.name !== '@everyone' && !role.managed)
            .sort((a, b) => b.position - a.position);

        for (const role of rolesToClone) {
            try {
                const newRole = await targetGuild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable,
                    reason: 'Cloning'
                });
                roleMapping.set(role.id, newRole.id);
                await sendLog(`Created Role: ${role.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create role: ${role.name}`);
            }
        }
    }

    const mapOverwrites = (overwrites) => {
        const newOverwrites = [];
        for (const ow of overwrites.values()) {
            if (ow.type === 'role' || ow.type === 0) {
                const targetRoleId = roleMapping.get(ow.id);
                if (targetRoleId) {
                    newOverwrites.push({
                        id: targetRoleId,
                        allow: ow.allow.bitfield.toString(),
                        deny: ow.deny.bitfield.toString(),
                    });
                }
            }
        }
        return newOverwrites;
    };

    if (opts[4]) {
        const categoryMapping = new Map();

        const categories = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_CATEGORY' || ch.type === 4)
            .sort((a, b) => a.position - b.position);

        for (const category of categories) {
            try {
                const newCat = await targetGuild.channels.create({
                    name: category.name,
                    type: 4,
                    position: category.position,
                    permissionOverwrites: mapOverwrites(category.permissionOverwrites.cache)
                });
                categoryMapping.set(category.id, newCat.id);
                await sendLog(`Created Category: ${category.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create category: ${category.name}`);
            }
        }

        const textChannels = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_TEXT' || ch.type === 0 || ch.type === 'GUILD_NEWS' || ch.type === 5)
            .sort((a, b) => a.position - b.position);

        for (const channel of textChannels) {
            try {
                const parentId = channel.parentId ? categoryMapping.get(channel.parentId) : null;
                await targetGuild.channels.create({
                    name: channel.name,
                    type: 0,
                    parent: parentId,
                    topic: channel.topic || '',
                    nsfw: channel.nsfw || false,
                    position: channel.position,
                    permissionOverwrites: mapOverwrites(channel.permissionOverwrites.cache)
                });
                await sendLog(`Created Text Channel: ${channel.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create text channel: ${channel.name}`);
            }
        }

        const voiceChannels = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_VOICE' || ch.type === 2)
            .sort((a, b) => a.position - b.position);

        for (const channel of voiceChannels) {
            try {
                const parentId = channel.parentId ? categoryMapping.get(channel.parentId) : null;
                await targetGuild.channels.create({
                    name: channel.name,
                    type: 2,
                    parent: parentId,
                    bitrate: Math.min(channel.bitrate || 64000, targetGuild.maximumBitrate || 96000),
                    userLimit: channel.userLimit || 0,
                    position: channel.position,
                    permissionOverwrites: mapOverwrites(channel.permissionOverwrites.cache)
                });
                await sendLog(`Created Voice Channel: ${channel.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create voice channel: ${channel.name}`);
            }
        }
    }

    if (opts[6]) {
        let maxEmojis = 50;
        if (targetGuild.premiumTier === 1) maxEmojis = 100;
        else if (targetGuild.premiumTier === 2) maxEmojis = 150;
        else if (targetGuild.premiumTier === 3) maxEmojis = 250;

        const currentStatic = targetGuild.emojis.cache.filter(e => !e.animated).size;
        const currentAnimated = targetGuild.emojis.cache.filter(e => e.animated).size;

        const availableStatic = Math.max(0, maxEmojis - currentStatic);
        const availableAnimated = Math.max(0, maxEmojis - currentAnimated);

        const sourceStatic = Array.from(sourceGuild.emojis.cache.filter(e => !e.animated).values()).slice(0, availableStatic);
        const sourceAnimated = Array.from(sourceGuild.emojis.cache.filter(e => e.animated).values()).slice(0, availableAnimated);

        const emojisToClone = [...sourceStatic, ...sourceAnimated];

        if (emojisToClone.length === 0) {
            await sendLog("⚠️ No available emoji slots in target server. Skipping emoji cloning.");
        } else {
            for (const emoji of emojisToClone) {
                try {
                    const createPromise = targetGuild.emojis.create({ attachment: emoji.url, name: emoji.name });
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('RATE_LIMIT_HANG')), 15000));

                    await Promise.race([createPromise, timeoutPromise]);
                    await sendLog(`Created Emoji: ${emoji.name}`);
                    await delay(1500);
                } catch (e) {
                    if (e.message === 'RATE_LIMIT_HANG' || e.code === 429) {
                        await sendLog("⚠️ Emoji upload limit hit (Discord Rate Limit)! I can't clone any more emojis. Skipping the rest...");
                        break;
                    }
                    if (e.code === 30014 || String(e).includes('Maximum number of emojis reached')) {
                        await sendLog("⚠️ Maximum emoji slots reached! Skipping remaining emojis...");
                        break;
                    }
                    await sendLog(`⚠️ Failed to copy emoji: ${emoji.name}`);
                }
            }
        }
    }

    await message.author.send("Cloning completed successfully!");
}

bot.login(BOT_TOKEN).catch(() => console.error("Invalid Bot Token"));
userClient.login(DC_TOKEN).catch(() => console.error("Invalid User Token"));

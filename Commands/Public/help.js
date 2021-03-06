module.exports = (bot, db, config, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
        if (suffix) {

            const getCommandHelp = (name, type, usage, description, examples) => {
                    let title_content, page_content, footer_content;
                    let embed_author = {
                        name: `Please go to the Wiki for more details`,
                        icon_url: bot.user.avatarURL,
                        url: config.hosting_url
                    };

                    msg_color = 0xffffff; //white color
                    title_content = ``;
                    page_content = `${description ? (`**Description:** \`${description}\``) : "**Description:** \`no description\`"}`;
					page_content += `\n\n${usage ? (`**Usage:** \`${usage}\``) : "**Usage:** \`no usage\`"}`;
					page_content += `\n${examples ? (`**Examples:** \`${examples}\``) : "**Examples:** \`no example\`"}`;
					//TODO: Delete after Testing page_content += `\n**WIKI Link:** <${config.hosting_url}wiki/Commands#${name}>`;

                    
					footer_content = `Help for ${type} command [${name}]`;

                    return { embed: { author: embed_author, color: msg_color, description: page_content, footer: { text: footer_content } } };
		};

		const info = [];
		const pmcommand = bot.getPMCommandMetadata(suffix);
		const publiccommand = bot.getPublicCommandMetadata(suffix);

		if(pmcommand && publiccommand) {
			info.push(getCommandHelp(suffix, "public & PM", publiccommand.usage, publiccommand.description, publiccommand.examples));
			info.push(`**WIKI Link:** <${config.hosting_url}wiki/Commands#${suffix}>`);
		} else if(pmcommand && !publiccommand) {
			info.push(getCommandHelp(suffix, "PM", pmcommand.usage));
			info.push(`**WIKI Link:** <${config.hosting_url}wiki/Commands#${suffix}>`);
		} else if(!pmcommand && publiccommand) {
			info.push(getCommandHelp(suffix, "public", publiccommand.usage, publiccommand.description, publiccommand.examples));
			info.push(`**WIKI Link:** <${config.hosting_url}wiki/Commands#${suffix}>`);
		}
	
		if(info.length==0) {
			info.push(`No such command \`${suffix}\``);
		}
		bot.sendArray(msg.channel, info);
		
	} else {

		let title_content, page_content, footer_content, fields_content;
		
		let msg_color = 0xffffff; //white color
		let embed_author = {
			name: `Type the respective command for more infos`,
			icon_url: bot.user.avatarURL,
			url: config.hosting_url
		};

		/* not needed atm
		footer_content = `To get an overview type the respective command (e.g. commands all)`;	
		title_content = ``; 
		page_content = `\n
		\`commands\` (to get all command categories)\n
		\`commands <category>\` (do not type the whole name 😅)\n
		\`commands pm\` (to get all commands in PM mode)\n
		\`commands all\` (to get all commands at once)`;
		*/

		fields_content = [
			{
				name: "commands",
				value: `to get all command categories`,
				inline: false
			},
			{
				name: "commands <category>",
				value: ` please do not type the whole name 😅`,
				inline: false
			},
			{
				name: "commands 'pm'",
				value: `shows all possible PM commands`,
				inline: false
			},
			{
				name: "commands 'all'",
				value: `Get all commands at once`,
				inline: false
			}
		];

		msg.author.getDMChannel().then(ch => {
			ch.createMessage({
				embed: {
					author: embed_author,
					color: msg_color,
					fields: fields_content,
				} 
			});

			ch.createMessage(`**##** *Link to WIKI: (<${config.hosting_url}wiki/Commands>)*\n` +
									`**##** *Support Discord server (<${config.discord_link}>)*`);
		});
	}
};
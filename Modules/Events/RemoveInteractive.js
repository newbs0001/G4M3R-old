const async = require("async");

module.exports = (bot, db, winston, serverDocument, msg) => {
    const hasDeletePerm = msg.channel.permissionsOf(bot.user.id).has("manageMessages");
    const max_page_size = 7;    // maximum events viewable per page

    let tmp = serverDocument.gameEvents;
    let pages = [];

    // generate a nested array representing viewable pages of events
    let new_page = [];
    for( let i = 0; i<tmp.length; i++ ) {
        new_page.push(tmp[i]);

        if((i+1)%max_page_size==0) {    // if page size has been reached
            pages.push(new_page);       // push the page onto pages,
            new_page = [];              // reset page,
        }
    }
    if(new_page.length>0)           // add the last page if it wasn't filled
        pages.push(new_page);       // and added in the previous loop

    pages.push([]);                         // weird fix, add an extra empty page
    let real_page_size = pages.length-1;    // set to never logically access it

    // function that is used to generate list of events to delete
    const getPage = (page_no) => {
        let current_page = pages[page_no-1];
        let page_content = "Please select the event you wish to delete\n\n";

        if(real_page_size == 0) {                                                // if there are
            page_content = "There are no events scheduled on this server.\n\n";  // no entries
        }                                                                        //
        else {
            for (let i=0; i<current_page.length; i++) {
                page_content += `\`\`[${i+1}]\`\` **${current_page[i].title}**#${current_page[i]._id}\n` +
                                `        -by <@${current_page[i]._author}>\n\n`;
            }
            page_content += "\n";
            if(real_page_size>1 && page_no<real_page_size ) {
                page_content += `\`\`[${max_page_size+1}]\`\` **Go to next page**\n`;
            }
            if(page_no>1){
                page_content += `\`\`[${max_page_size+2}]\`\` **Return to previous page**\n`;
            }
        }
        page_content += `## \`\`[exit]\`\` to quit the interactive\n`;

        let footer_content = real_page_size>0 ? `page ${page_no}/${real_page_size}` : `page 1/1`;

        return {embed: {description: page_content, footer: {text: footer_content}}}
    };

    // function which is used to generate a page which confirms which event to delete
    const getRemoveVerify = (event_no) => {
        let event = pages[current_page_no-1][event_no-1];
        let page_content = "" +
            `\`\`Title\`\`: ${event.title}\n` +
            `\`\`Author\`\`: <@${event._author}>\n` +
            `\`\`Start\`\`: ${event.start}\n` +
            `\`\`End:\`\` ${event.end}\n\n` +
            `##\`\`[confirm]\`\` to delete the event\n` +
            `## \`\`[back]\`\` to return to event list\n` +
            `## \`\`[exit]\`\` to quit the interactive`;

        let footer_content = `event ID# ${event._id}`;

        return {embed: {description: page_content, footer: {text: footer_content}}}
    };

    let current_page_no = 1;
    let current_event_no;
    let embed = getPage(current_page_no);
    let cancel = false;
    let confirm = false;

    async.whilst(() => {
            return !cancel;
        },
        (callback) => {
            msg.channel.createMessage(embed).then(bot_message => {
                let timeout = setTimeout(()=>{bot_message.delete();}, 60000); //delete message in 1 minute

                bot.awaitMessage(msg.channel.id, msg.author.id, usr_message => {
                    bot.removeMessageListener(msg.channel.id, msg.author.id); // remove the awaitMessage listener
                    clearTimeout(timeout);  //clear the active timeout

                    let usr_input = usr_message.content.trim();

                    if(confirm) {       // if in event view
                        if(usr_input == "confirm"){
                            let id = pages[current_page_no-1][current_event_no-1]._id;
                            pages[current_page_no-1] = pages[current_page_no-1].splice(current_event_no-1, 1);
                            pages[current_page_no-1][current_event_no-1].remove();

                            serverDocument.save(err => {
                                if(err) {
                                    winston.error(`Failed to remove event placeholder info`, {srvid: serverDocument._id}, err);
                                } else {
                                    msg.channel.createMessage(`Event #${id} has been successfully removed`).then((msg)=> {
                                        setTimeout(()=>{msg.delete();},10000);
                                    });
                                }
                            });

                            embed = getPage(current_page_no);
                            confirm = false;
                        }
                        // return to event list page
                        else if(usr_input == "back") {
                            confirm = false;
                            embed = getPage(current_page_no);
                        }
                        // exit
                        else if(usr_input == "exit") {
                            cancel = true;
                        }
                    }
                    else {      // otherwise
                        // get event
                        if (usr_message.content.trim() <= pages[current_page_no-1].length && usr_input > 0) {
                            current_event_no = usr_input;
                            embed = getRemoveVerify(usr_input);
                            confirm = true;
                        }
                        // go to next page
                        else if (usr_input == max_page_size+1 && current_page_no<real_page_size) {
                            current_page_no++;
                            embed = getPage(current_page_no);
                        }
                        // go to previous page
                        else if (usr_input == max_page_size+2 && current_page_no>1) {
                            current_page_no--;
                            embed = getPage(current_page_no);
                        }
                        // exit interactive
                        else if(usr_input.toLowerCase() == "exit") {
                            cancel = true;
                        }
                        // error
                        else {
                            msg.channel.createMessage("That's not an option! Please try again.").then((msg)=> {
                                setTimeout(()=>{msg.delete();},10000)
                            });
                        }
                    }

                    bot_message.delete();
                    if(hasDeletePerm) {
                        usr_message.delete();
                    }

                    callback();
                });
            });
        });
};


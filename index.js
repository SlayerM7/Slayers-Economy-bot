const {  Client, MessageEmbed } = require('discord.js')
const { prefix, token, main_color: color, rejectionUsers, rejections, acceptionsUsers } = require('./config.json')
const handle = require('./handlers/handle');
const client = new Client();
const defines = require('./handlers/defines');
const fs = require('fs');
const bank = require('./db/bank.json');
const wallet = require('./db/wallet.json');
const { rawListeners } = require('process');
defines(client);
handle(client);
client.on("message", message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    try {
        var curbank = bank[message.author.id].amount;
        var curwllt = wallet[message.author.id].amount;
    } catch (e) {

        wallet[message.author.id] = {
            amount: 0
        }

        bank[message.author.id] = {
            amount: 0
        }

        fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 4), (err) => {
            if (err) console.log(err)
        })
        fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 4), (err) => {
            if (err) console.log(err)
        })
        message.reply("I could not find you in my database, I am adding you..")
        return;
    }


    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLocaleLowerCase();


    if (!message.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send('I am missing the `ADMINISTRATOR` permission.')

    if (command === 'buy') {
        let userBalance = curwllt
        if (userBalance.amount < 1) return message.channel.send("Looks like you are poor.");
        let item = args[0];
        if (!item) return message.channel.send("What are you trying to buy?");
        let hasItem = client.shop[item.toLowerCase()];
        if (!hasItem || hasItem == undefined) return message.reply("That item doesnt exists lol");
        let isBalanceEnough = (userBalance >= hasItem.cost);
        if (!isBalanceEnough) return message.reply("Your balance is insufficient. You need :dollar: " + hasItem.cost + " to buy this item.");

        const amountt = curwllt - parseInt(hasItem.cost)

        wallet[message.author.id] = {
            amount: amountt
        }

        let itemStruct = require(`./db/${item.toLowerCase()}.json`);

        itemStruct[message.author.id] = {
            name: item.toLowerCase(),
            prize: hasItem.cost,
            usage: true
        }

        fs.writeFile(`./db/${item.toLowerCase()}.json`, JSON.stringify(itemStruct, null, 2), (err) => { if (err) console.log(err) })
        message.channel.send(`You purchased **${item}** for **:dollar: ${hasItem.cost}**.`)
        fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
            if (err) console.log(err);
        });
    }

    if (command === 'daily') {
        if (client.daily.has(message.author.id)) return message.channel.send('You already claimed your daily gift, wait for the next day');

        client.daily.add(message.author.id);

        try {
            const dailyAmount = Math.floor(Math.random() * 500);
            message.reply(`You have claimed your daily reward of **${dailyAmount}**`);
            const Mathh = curwllt + dailyAmount
            wallet[message.author.id] = {
                amount: Mathh
            }
            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => { if (err) console.log(err) })
        } catch (error) {
            message.channel.send('There was a error claiming the daily reward')
        }

        setTimeout(() => {
            client.daily.delete(message.author.id);
        }, 600 * 1000)
    }

    if (command === 'jobs') {
        let items = Object.keys(client.jobs);
        let content = "";
        for (var i in items) {
            content += `${items[i]} - :dollar: ${client.jobs[items[i]].cost}\n`
        }
        let embed = new MessageEmbed()
            .setTitle("Jobs")
            .setDescription(content)
            .setColor("RANDOM")
            .setFooter("Do: !work <job> to work at that job.")
        try {
            return message.channel.send(embed)
        } catch (e) {
            message.channel.send('I could not send the embed(Is it a lack of permissions?)')
        }
    }

    if (command === 'shop') {
        let items = Object.keys(client.shop);
        let content = "";
        for (var i in items) {
            content += `${items[i]} - :dollar: ${client.shop[items[i]].cost}\n`
        }
        let embed = new MessageEmbed()
            .setTitle("Store")
            .setDescription(content)
            .setColor("RANDOM")
            .setFooter("Do: !buy <item> to purchase the item.")
        try {
            return message.channel.send(embed)
        } catch (e) {
            message.channel.send('I could not send the embed(Is it a lack of permissions?)')
        }
    }

    if (command === 'give') {
        const user = message.mentions.users.first();
        const amount = args[1];
        if (!user) return message.channel.send('Who do you want to give money to?');
        if (!amount) return message.channel.send('How much do you wanna give the user?');
        try {
            wallet[user.id].amount;
        } catch (e) {
            wallet[user.id] = {
                amount: 0
            }
            bank[user.id] = {
                amount: 0
            }
            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => { if (err) console.log(err) });
            fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 2), (err) => { if (err) console.log(err) });
        }
        if (amount > curwllt) return message.channel.send(`You can\'t Give more than you have! You have **${curwllt}** in your wallet! Get more money or withdraw some`);

        const doMath = wallet[user.id].amount + parseInt(amount);

        wallet[user.id] = {
            amount: doMath
        }

        fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
            if (err) console.log(err)
        });

        const notDoMath = curwllt - parseInt(amount);

        wallet[message.author.id] = {
            amount: notDoMath
        }

        fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
            if (err) console.log(err);
        });

        const embed = new MessageEmbed()
            .setTitle(`Money Added!`)
            .addField(`User`, `<@${user.id}>`)
            .addField(`Balance Given`, `${amount} 💸`)
            .addField(`Total Amount`, wallet[user.id].amount)
            .setColor("RANDOM")
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();
        return message.channel.send(embed);
    }

 

    if (command === 'work') {
        if (client.work.has(message.author.id)) {
            return message.channel.send('You are working dumb dumb! Wait till you finish')
        }
        if (!args[0]) return message.channel.send('What do u wanna work as? You can see all options in !jobs');
        if (args[0] === 'construction') {
            try {
                require('./db/hammer.json')[message.author.id].hammer === true;
            } catch (e) {
                return message.channel.send('You don\'t own a hammer buddy, Go buy one first')
            }
            const amount = 1000
            message.channel.send('You are now working! You will be working for *6 hours*');
            const doMath = wallet[message.author.id].amount + parseInt(amount);
            client.work.set(message.author.id)

            setTimeout(() => {
                client.work.delete(message.author.id);
                wallet[message.author.id] = {
                    amount: doMath
                }
                message.reply(`You are done with work! You not have **${doMath}** in your wallet`)
                fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => { if (err) console.log(err) })
            }, 600 * 1000)
        }
        if (args[0] === 'office') {
            try {
                require('./db/laptop.json')[message.author.id].usage === true;
            } catch (e) {
                return message.channel.send('You don\'t own a laptop buddy, Go buy one first')
            }
            const amount = 1000
            message.channel.send('You are now working! You will be working for *6 hours*');
            const doMath = wallet[message.author.id].amount + parseInt(amount);
            client.work.set(message.author.id)

            setTimeout(() => {
                client.work.delete(message.author.id);
                wallet[message.author.id] = {
                    amount: doMath
                }
                message.reply(`You are done with work! You not have **${doMath}** in your wallet`)
                fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => { if (err) console.log(err) })
            }, 600 * 1000)
        }
    }


    if (command === 'bal' || command === 'balance') {
        let user = message.mentions.users.first();
        if (!user) user = message.author
        try {

            const embed = new MessageEmbed()
                .setTitle('Balance')
                .addField('User', `<@${user.id}>`)
                .addField('Wallet', `${wallet[user.id].amount} 💸`)
                .addField('Bank', bank[user.id].amount + ' 🏦')
                .setColor("RANDOM")
                .setThumbnail(user.displayAvatarURL)
                .setTimestamp();
            message.channel.send(embed)
        } catch (e) {
            //  console.log(e)
            wallet[user.id] = {
                amount: 0
            },
                bank[user.id] = {
                    amount: 0
                }

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => { if (err) console.log(err) })
            fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 2), (err) => { if (err) console.log(err) })
            message.channel.send(client.nodb)
        }
    }

    if (command === 'withdraw' || command === 'with') {

        if (args[0] === 'all') {
                if (curbank === 0) return message.reply('Looks like u poor, You have nothing in your bank')
                const bankMath2 = wallet[message.author.id].amount + curbank
             //   console.log(bankMath2);
    
                wallet[message.author.id] = {
                    amount: bankMath2
                }
                bank[message.author.id] = {
                    amount: 0
                }
                message.reply(`Has Withdrawed **${curbank}** and now has **${curbank + curbank}** in their bank 💸`)
    
                fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
                    if (err) console.log(err)
                })
                fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 2), (err) => {
                    if (err) console.log(err)
                })
                return;
        }

        const amount = args[0];
        if (!amount) return message.channel.send('How much are you withdrawing?');
        if (isNaN(amount)) return message.channel.send('Amount must be a number')
        if (amount > bank[message.author.id].amount) return message.channel.send(`You cant withdraw more than you have, You have **${bank[message.author.id].amount}** coins in your bank`);

        const doMath = bank[message.author.id].amount - amount;
        const walletMath = wallet[message.author.id].amount + parseInt(amount);

        wallet[message.author.id] = {
            amount: walletMath
        }
        bank[message.author.id] = {
            amount: doMath
        }

        fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
            if (err) console.log(err)
        })
        fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 2), (err) => {
            if (err) console.log(err)
        })

        message.reply(`You have withdrawed **${amount}**`)
    }

    if (command === 'dep' || command === 'deposit') {
        if (args[0] === 'all') {
            if (curwllt === 0) return message.reply('Looks like u poor, You have nothing in your wallet')
            const bankMath2 = bank[message.author.id].amount + curwllt
          //  console.log(bankMath2);

            wallet[message.author.id] = {
                amount: 0
            }
            bank[message.author.id] = {
                amount: bankMath2
            }
            message.reply(`Has Deposited **${curwllt}** and now has **${curwllt - curwllt}** in their wallet`);

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
                if (err) console.log(err)
            })
            fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 2), (err) => {
                if (err) console.log(err)
            })
        } else {

            const amount = args[0];
            if (!amount) return message.channel.send('How much are you depositing??');
            if (isNaN(args[0])) return message.reply('The amount has to be a number')
            if (amount > wallet[message.author.id].amount) return message.channel.send('You to broke haha , U dont have that much money')
            const doMath = wallet[message.author.id].amount - amount;
            const bankMath = bank[message.author.id].amount + parseInt(amount);
           // console.log(bankMath);

            wallet[message.author.id] = {
                amount: doMath
            }
            bank[message.author.id] = {
                amount: bankMath
            }
            message.reply(`Has Deposited **${amount}** and now has **${curwllt - amount}** in their wallet 💸`);

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
                if (err) console.log(err)
            })
            fs.writeFile('./db/bank.json', JSON.stringify(bank, null, 2), (err) => {
                if (err) console.log(err)
            })
        }
    }

    if (command === 'help') {
        const helpEmbed = new MessageEmbed()
        .setColor(color)
        .setTitle('Help menu')
        .setThumbnail(client.user.displayAvatarURL())
        .addField('Commands:', '\n `gamble` `balance` `deposit` `daily`\n `withdraw` `snipe` `beg` `work`\n `give` `shop` `jobs` `buy`')
        .setFooter('Made by slayer')
        .setTimestamp()

        message.channel.send(helpEmbed)
    }

    if (command === 'gamble') {
        const amount = args[0];
        if (isNaN(amount)) return message.channel.send('The amount must be a number')
        if (!amount) return message.reply('Try running the command again, But this time mention how much you want to gabble')

        if (curwllt < amount) return message.reply(`Hey! You dont have that much on your wallet!`);

        if (amount < 200) return message.channel.send('You cannt ganble less than **200**')

        const gambleAmount = Math.floor(Math.random() * 4)
        
        if (gambleAmount === 3) {
            const gambleLoss = Math.floor(Math.random() *amount);
            message.reply('You lost the gamble!! You lost **' + gambleLoss+'**' + '💸');

            const amt = curwllt - gambleLoss

            wallet[message.author.id] = {
                amount: amt
            }

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
                if (err) console.log(err)
            })
        }
        if (gambleAmount === 2) {
            const gambleLoss = Math.floor(Math.random() *amount) * 2
            message.reply('You lost the gamble!! You lost **' + gambleLoss+'**' + '💸');

            const amt = curwllt - gambleLoss

            wallet[message.author.id] = {
                amount: amt
            }

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
                if (err) console.log(err)
            })
        }
        if (gambleAmount===1) {
            const gambleLoss = Math.floor(Math.random() *amount);
            message.reply('You won the gamble!! You won **' + gambleLoss+'**' + '💸');

            const amt = curwllt + gambleLoss

            wallet[message.author.id] = {
                amount: amt
            }

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
                if (err) console.log(err)
            })
        }
        if (gambleAmount === 4) {
            const gambleLoss = Math.floor(Math.random() *amount);
            message.reply('The gamble broke even!');
        }
    }
    const {Message} = require('discord.js')
    /**
     * @param {Message} message
     */
    const rob = new Set();
    const robbey = new Set();
    if (command === 'rob' || command === 'steal') {
        if (robbey.has(message.author.id)) return message.reply('Buddy, You already robbed someone recently. Chill or the cops will find you')
        const user = message.mentions.users.first();
        if (!user) return message.channel.send('No user was mentioned...');
        if (rob.has(user.id)) return message.reply('Woah buddy , That user has been robbed recently. Chill tf out');
        if (wallet[user.id].amount < 500) return message.channel.send('The user doesn\'t have **500** in their wallet');

    const r = Math.floor(Math.random() * wallet[user.id].amount);
    message.reply(`You stole **${r}** from ${user.tag}`);
        rob.add(user.id)
        robbey.add(message.author.id);
        setTimeout(() => {
            rob.delete(user.id);
            robbey.delete(message.author.id);
        }, 50 * 1000);
    const nxt = curwllt + r
        const reverseNxt = wallet[user.id].amount - r;
     wallet[message.author.id] = {
        amount: nxt
    }
    fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
        if (err) console.log(err);
    })
    wallet[user.id] = {
        amount: reverseNxt
    }
    fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => {
        if (err) console.log(err);
    })



}
    if (command === 'snipe') {
        const msg = client.snipes.get(message.channel.id);
        if (!msg) return message.reply('There nothing to snipe')
        const snipeEmbed = new MessageEmbed()
            .setColor(color)
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
            .setDescription(msg.conetnt)
            .setTimestamp()

        message.channel.send(snipeEmbed)
    }

    if (command === 'beg') {
        if (client.beg.has(message.author.id)) {
            return message.channel.send(`BEGON THOT! You are on ge cooldown`)
        }

        const randomBeg = Math.floor(Math.random() * 100);
        const begAmount = Math.floor(Math.random() * 600)
        const doMath = wallet[message.author.id].amount + begAmount;
     //   console.log(doMath)
        client.beg.add(message.author.id)
        setTimeout(() => {
            client.beg.delete(message.author.id)
        }, 10 * 1000)
        if (randomBeg < 25) {
            message.reply(rejectionUsers[Math.floor(Math.random() * rejectionUsers.length)] + ' Said ' + rejections[Math.floor(Math.random() * rejections.length)]);
            return;
        } else {
            message.channel.send('**' + acceptionsUsers[Math.floor(Math.random() * acceptionsUsers.length)] + '**' + ` donated you **${begAmount}** 💸. Now you have **${curwllt + begAmount}** in yor wallet`);

            wallet[message.author.id] = {
                amount: doMath
            }

            fs.writeFile('./db/wallet.json', JSON.stringify(wallet, null, 2), (err) => { if (err) console.log(err) })
        }

    }
})

client.on("messageDelete", (message) => {
    client.snipes.set(message.channel.id, {
        conetnt: message.content,
        author: message.author
    });
});

client.login(token)
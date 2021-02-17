module.exports = (client) => {
    const { MessageEmbed } = require('discord.js')
    client.snipes = new Map();
    client.work = new Map();
    client.cooldowns = new Set();
    
    client.shop = {
        laptop: {
          cost: 2000
        },
        mobile: {
          cost: 1000
        },
        pc: {
          cost: 3000
        },
        hammer: {
            cost: 2000
        }
      };


      client.jobs = {
        construction: {
          cost: 6000
        },
        office: {
          cost: 1000
        },
      };


    client.beg = new Set();
    client.daily = new Set();
    client.nodb = new MessageEmbed()
    .setColor(require('../config.json').main_color)
    .setDescription('The user is not on my database.. I am adding them..')
}
const config = require('../config.json')
const { Client } = require('discord.js')
module.exports = (client) => {
    console.log("Ready!")
    client.user.setStatus(config.status_activity)
    client.user.setActivity(config.status_status, {
        type: config.status_type,
        url: config.status_url
    })
}
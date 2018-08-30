const bot = require('../bot')
const moment = require('moment')
const $ = require('../assets/functions')
const Music = require('./music')
const db = bot.db

const members = bot.events

var Events = {}

Events.voiceStateUpdate = async (oldMember, newMember) => {
  if (newMember.user.bot || newMember.user.id == '348126827186749440') return
  if (!members[newMember.user.id]) {
    members[newMember.user.id] = {
      roleid: null
    }
  }
  const config = $.getServerConfig(newMember.guild.id)
  const member = members[newMember.user.id]

  var msg

  if (oldMember.voiceChannelID !== null && newMember.voiceChannelID === null) {
    let music = new Music(oldMember)

    msg = `**${oldMember.user.username}** has disconnected from **${bot.channels.get(oldMember.voiceChannelID).name}**`

    if (bot.channels.get(oldMember.voiceChannelID).members.filter(s => !s.user.bot).size === 0) {
      music.pause()
    }

    if (member.roleid) {
      oldMember.roles
        .remove(member.roleid)
        .then(() => {
          member.roleid = null
        })
        .catch(() => {})
    }
  } else if (oldMember.voiceChannelID === null && newMember.voiceChannelID !== null) {
    let music = new Music(newMember)

    msg = `**${newMember.user.username}** has connected to **${bot.channels.get(newMember.voiceChannelID).name}**`

    if (bot.channels.get(newMember.voiceChannelID).members.filter(s => !s.user.bot).size === 1) {
      music.resume()
    }

    if (config.music.roles[newMember.voiceChannelID]) {
      newMember.roles
        .add(config.music.roles[newMember.voiceChannelID])
        .then(() => {
          member.roleid = config.music.roles[newMember.voiceChannelID]
        })
        .catch(() => {})
    }
  }

  if (msg) {
    if (bot.channels.get(config.channel.voicetts)) {
      bot.channels
        .get(config.channel.voicetts)
        .send(msg.replace(/\*\*/g, ''), {
          tts: true
        })
        .then(msg =>
          msg
            .delete({
              timeout: 3000
            })
            .catch(() => {})
        )
    }
    if (bot.channels.get(config.channel.log)) {
      bot.channels.get(config.channel.log).send(
        $.embed()
          .setAuthor(
            'Voice Presence Update',
            `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png?size=16`
          )
          .setDescription(`\`${moment().format('YYYY-MM-DD hh:mm:ss A')}\`:bust_in_silhouette:${msg}.`)
      )
    }
  }
}

Events.presenceUpdate = (oldMember, newMember) => {
  if (newMember.user.bot) return

  const config = $.getServerConfig(newMember.guild.id)
  var msg
  if (oldMember.presence.status !== newMember.presence.status) {
    msg = `**${newMember.user.username}** is now **${newMember.presence.status}**`
  } else if (oldMember.presence.activity !== newMember.presence.activity) {
    msg = `**${newMember.user.username}** is now ${
      newMember.presence.activity ? newMember.presence.activity.type.toLowerCase() : 'playing'
    } **${!newMember.presence.activity ? 'nothing' : newMember.presence.activity.name}**`
  }
  if (msg && bot.channels.get(config.channel.log)) {
    bot.channels.get(config.channel.log).send(
      $.embed()
        .setAuthor(
          'User Presence Update',
          `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png?size=16`
        )
        .setDescription(`\`${moment().format('YYYY-MM-DD hh:mm:ss A')}\`:bust_in_silhouette:${msg}.`)
    )
  }
}

Events.guildMemberAdd = member => {
  var config = $.getServerConfig(member.guild.id)
  var channel = member.guild.channels.find(x => x.rawPosition === 0 && x.type === 'text')

  bot.channels
    .get(channel.id)
    .send(
      $.embed()
        .setAuthor('New Member', `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png?size=16`)
        .setDescription(`Welcome to ${member.guild.name}, ${member.user.toString()}!`)
    )
    .then(s =>
      s
        .delete({
          timeout: 30000
        })
        .catch(() => {})
    )
    .catch(() => {})

  if (bot.channels.get(config.channel.log)) {
    bot.channels.get(config.channel.log).send(
      $.embed()
        .setAuthor(
          'Guild Member Update',
          `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png?size=16`
        )
        .setDescription(`\`${moment().format('YYYY-MM-DD hh:mm:ss A')}\` ${member.user.username} joined the server.`)
    )
  }
}

Events.guildMemberRemove = member => {
  var config = $.getServerConfig(member.guild.id)
  var channel = member.guild.channels.find(x => x.rawPosition === 0 && x.type === 'text')

  bot.channels
    .get(channel.id)
    .send(
      $.embed()
        .setAuthor('Member Left', `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png?size=16`)
        .setDescription(`${member.user.tag} left the server!`)
    )
    .then(s =>
      s
        .delete({
          timeout: 30000
        })
        .catch(() => {})
    )
  if (bot.channels.get(config.channel.log)) {
    bot.channels.get(config.channel.log).send(
      $.embed()
        .setAuthor(
          'Guild Member Update',
          `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png?size=16`
        )
        .setDescription(`\`${moment().format('YYYY-MM-DD hh:mm:ss A')}\` ${member.user.username} left the server.`)
    )
  }
}

Events.guildCreate = async guild => {
  var guilds = Array.from(bot.guilds.keys())
  var guildlist = await db
    .collection('servers')
    .find({})
    .toArray()
  $.processDatabase(guilds, guildlist)
}

Events.messageDelete = message => {
  var config = $.getServerConfig(message.guild.id)

  if (config.channel.msgdelete && message.content) {
    bot.channels.get(config.channel.msgdelete).send(
      $.embed()
        .setTitle('✉ Message Deleted')
        .addField('User: ', message.author.tag)
        .addField('Content: ', message.content)
        .setFooter(moment().format('YYYY-MM-DD hh:mm:ss A'))
    )
  }
}

module.exports = Events

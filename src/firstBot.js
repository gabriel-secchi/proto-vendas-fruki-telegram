const env       = require('../.env')
const Telegraf  = require('telegraf')
const Markup    = require('telegraf/markup')
const bot       = new Telegraf(env.token)


bot.start( async ctx => {
    const from = ctx.update.message.from 
    
    console.log(`${from.first_name} entrou!`)

    await ctx.reply(`Olá ${from.first_name}, preciso do número do seu telefone para continuarmos.`);
    ctx.reply(
        'Poderia me enviar?',
        Markup.keyboard(
            [{text: "📲 Enviar meu número", request_contact: true}]
        ).resize().oneTime().extra()
    )
})

bot.on('text', ctx => {
    const message = ctx.update.message
    console.log(`O '${message.from.first_name}' enviou a mensagem -> ${message.text}`)
    //ctx.reply('Foda-se, não estou nem aí!! ')
    ctx.replyWithVideo(    
        'https://i.makeagif.com/media/6-07-2015/ItWRrY.gif', 
        {
            caption: 'Foda-se, não tô nem aí!!'
        }
    )
})

bot.on('contact', async ctx => {
    const message = ctx.update.message
    const name = message.from.first_name
    await ctx.reply(`Muito obrigado ${name}`)
    
    console.log(`O ${name} enviou o número -> ${message.contact.phone_number}`)
    
    ctx.reply(
        'O que você gostaria de fazer hoje?',
        Markup.keyboard([
            ['AAA', 'BBB', 'CCC'],
            ['DDD', 'EEE', 'FFF'],
            ['GGG', 'HHH', 'III']
        ]).resize().oneTime().extra()
    )
})

/*
bot.phone(number, ctx => {
    console.log(number)
})
*/


bot.startPolling()

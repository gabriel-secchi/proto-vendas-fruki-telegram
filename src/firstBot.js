const env       = require('../.env')
const Telegraf  = require('telegraf')
const Extra    = require('telegraf/extra')
const Markup    = require('telegraf/markup')
const { markup } = require('telegraf/extra')
const bot       = new Telegraf(env.token)

const botoes = Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('teste 123', 'aaa'),
    Markup.callbackButton('qqqqq', '*qwe')
]))

var teste = null;

bot.start( async ctx => {
    console.log('aaaa')
    /* const from = ctx.update.message.from 
    
    console.log(`${from.first_name} entrou!`)
    teste = from.first_name;
    await ctx.reply(`Olá ${from.first_name}, preciso do número do seu telefone para continuarmos.`);
    await ctx.reply("teste btn", botoes) */
    
    /* ctx.reply(
        'Poderia me enviar?',
        Markup.keyboard(
            [{text: "📲 Enviar meu número", request_contact: true}]
        ).resize().oneTime().extra()
    ) */
})

bot.action('*qwe', async ctx => {
    console.log('aqui 12345')
    //console.log(ctx.update.callback_query.from.id)
    //console.log( await ctx.getChatMember(ctx.update.callback_query.from.id) ) 
    console.log(`ultimo chamada ${teste}`)
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

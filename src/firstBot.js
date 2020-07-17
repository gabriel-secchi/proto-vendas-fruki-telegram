const env         = require('../.env')
const Telegraf    = require('telegraf')
const Extra       = require('telegraf/extra')
const Markup      = require('telegraf/markup')
const bot         = new Telegraf(env.token)
const axios       = require('axios')
const redisClient = require('./redis/connect.js').redisClient

//redisClient.set("123", "teste gabriel", "EX", "20")
const getIdUser = (ctx) => {
    let message = null

    if( ctx.update.callback_query )
        message = ctx.update.callback_query
    else
        message = ctx.update.message

    return message.from.id
}
const getClientCode = async (userId, onSuccess) => {
    let clientCode = null
    redisClient.get(`${userId}_clientCode`, (error, data) => {
        if( error ) {
            console.log('Falha ao obter o código do cliente')
            console.log(error)
            return
        }
        
        if( data ) {
            onSuccess(clientCode)
            return
        }

        //buscar codigo totvs

        //pedir telefone
        //buscar fone totvs
        //salvar id

        //se não encontrou pelo fone, solicitar cnpj
        //buscar pj totvs
        //salvar id
        
        clientCode = 1234
        
    })
}

const botoes = Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('Fazer pedido', '*fazer_pedido*'),
    Markup.callbackButton('Consultar preço', '*consult_preco*'),
    Markup.callbackButton('Consultar pedido', '*consult_pedido*')
]))

const initChat = async ctx => {
    const from = ctx.update.message.from 
    const userName = from.first_name
    console.log(`${userName} entrou!`)

    await ctx.reply(`Olá ${userName}, tudo bem? Espero que sim. O que você gostaria de fazer hoje?`, botoes)    
    
    /* ctx.reply(
        'Poderia me enviar?',
        Markup.keyboard(
            [{text: "📲 Enviar meu número", request_contact: true}]
        ).resize().oneTime().extra()
    ) */
}

bot.start( ctx => {
    initChat(ctx)
})

bot.on('text', ctx => {
    initChat(ctx)
})

bot.action('*consult_preco*', async ctx => {
    await ctx.reply('Certo, vou buscar os produtos pra te mostrar.')
    await ctx.reply('Só um momento.')
    axios.get(`${env.urlApi}/telegram/produtos`)
        .then(async response => {
            if(response.data)            
                response.data.forEach(objproduto => {
                    ctx.reply(`${objproduto.descricao} :  R$${objproduto.preco}`)
                });
            else
                ctx.reply('Desculpe, não encontrei nenhum produto. 🥺')
        })
        .catch(async error => {
            await ctx.reply('Desculpe 🥺')
            ctx.reply('parece que estamos com algumproblema em nossos servidores.Tente novamente emalguns instantes.')
        })

})

bot.action('*consult_pedido*', async ctx => {
    const userId = await getIdUser(ctx)
    await getClientCode(userId, (clientCode) => {
        console.log(`Código cliente: ${clientCode}`)
        return clientCode
    })
})

bot.on('contact', async ctx => {
    const message = ctx.update.message
    const name = message.from.first_name
    await ctx.reply(`Muito obrigado ${name}`)
    
    console.log(`O ${name} enviou o número -> ${message.contact.phone_number}`)
})


bot.startPolling()

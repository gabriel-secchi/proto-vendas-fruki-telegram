const env         = require('../.env')
const Telegraf    = require('telegraf')
const Extra       = require('telegraf/extra')
const Markup      = require('telegraf/markup')
const bot         = new Telegraf(env.token)
const axios       = require('axios')
//const redisClient = require('./redis/connect.js').redisClient
const Cliente     = require('./cliente').getInstance
const Produto     = require('./produto').getInstance
const Carrinho    = require('./carrinho').getInstance
const Pedido      = require('./pedido').getInstance
const ObjProduto  = require('./objects/obj_produto').getInstance


const getIdUser = (ctx) => {
    let message = null

    if( ctx.update.callback_query )
        message = ctx.update.callback_query
    else
        message = ctx.update.message

    return message.from.id
}

var produtosCliente = new Array();
var dadosPagamento = new Array();


const addBotoesIniciais = (idUserTelegram, onSuccess) => {
    let markups = []
    markups.push(Markup.callbackButton('Consultar Preços', '*consult_preco*'))
    markups.push(Markup.callbackButton('Fazer pedido', '*fazer_pedido*'))
    markups.push(Markup.callbackButton('Ver pedido', '*consultar_pedido*'))

    Carrinho.exists(idUserTelegram, function(exist) {
        
        if(exist){  
            markups.push(Markup.callbackButton('Ver carrinho', '*consult_carrinho*'))
        }

        onSuccess(Extra.markup(Markup.inlineKeyboard(markups, {columns: 2})))
        
    })
}

const botoesLimparCarrinho = Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('Sim', '*limparCarrinho*'),
    Markup.callbackButton('Não', '*naoLimparCarrinho*')
], {columns: 2}));

const initChat = async ctx => {
    const from = ctx.update.message.from 
    const userName = from.first_name
    const userId = await getIdUser(ctx)
    console.log(`${userName} entrou! ID: ${getIdUser(ctx)}`)

    addBotoesIniciais(userId, (botoes) => {
        ctx.reply(`Olá ${userName}, tudo bem? Espero que sim. O que você gostaria de fazer hoje?`, botoes)
    })
}

bot.start( ctx => {
    initChat(ctx)
})

bot.on('text', async ctx => {
    const userId = await getIdUser(ctx)
    const textoDigitado = ctx.update.message.text

    
    if( textoDigitado.trim().toLowerCase() === "cancelar") {
        await ctx.reply("Você realmente quer cancelar?")
        await ctx.reply("isso irá excluir os itens do seu carrinho", botoesLimparCarrinho)
        return;
    }

    Carrinho.isEdicaoProduto(userId, async (isEdicaoProduto, codProduto) =>  {
        if(isEdicaoProduto){
            const valDigitado = parseInt(textoDigitado)
            if(isNaN(valDigitado) || valDigitado < 1) {
                await ctx.reply('A quantidade que você digitou não é válida')
                await ctx.reply('Só são válidos números inteiros, 0 (zero) para ignorar ou remover o produto do carrinho')
                await ctx.reply('Digite um número válido.')

                console.log(`Tentou numero invalido (${textoDigitado}) para produto ${codProduto}`)

                await Carrinho.setEdicaoProduto(userId, codProduto)
                return;
            }

            let objProduto = new ObjProduto()
            objProduto.buildObject(`***${codProduto}`, produtosCliente[userId])
            await Carrinho.addItemCarrinho(ctx, userId, objProduto, valDigitado)

            return
        }
        else
            initChat(ctx)
    })
})

bot.action('*consult_preco*', async ctx => {
    await ctx.reply('Certo, vou buscar os produtos pra te mostrar.')
    await ctx.reply('Só um momento.')

    const userId = await getIdUser(ctx)
    await Cliente.getClientCodeByRedis(
        ctx,
        userId,
        (codClienteTotvs) => {
            Produto.obterListaProdutos(ctx, codClienteTotvs, async (listaProdutos) => {
                for(const [idx, objproduto] of listaProdutos.entries() ) {
                    await ctx.replyWithHTML(`${objproduto.descricao}:  <b>R$${objproduto.preco}</b>`)
                }

                addBotoesIniciais(userId, (botoes) => {
                    ctx.replyWithHTML('Posso te ajudar em mais alguma coisa?', botoes)
                })
            }); 
        }
    );
})

bot.action('*fazer_pedido*', async ctx => {
    const userId = await getIdUser(ctx)

    await Cliente.getClientCodeByRedis(
        ctx,
        userId,
        (codClienteTotvs) => {
            Produto.obterListaProdutos(ctx, codClienteTotvs, async (listaProdutos) => {
                produtosCliente[userId] =  new Array()
                for(const [idx, objproduto] of listaProdutos.entries() ) {
                    const valProduto = parseFloat(objproduto.preco).toFixed(2);
                    const keyButton = `*produto***${objproduto.codigo}`

                    produtosCliente[userId][objproduto.codigo] = {descricao: objproduto.descricao, preco: valProduto }
                    
                    const botao_add_produto = Extra.markup(Markup.inlineKeyboard([
                        //Markup.callbackButton('Adicionar ao pedido', keyButton)
                        Markup.callbackButton(`Adicionar ${objproduto.descricao}`, keyButton)
                    ]));
                        
                    await ctx.replyWithHTML(`${objproduto.descricao}:  <b>R$${objproduto.preco}</b>`, botao_add_produto)
                }
            }); 
        }
    );
})
 
bot.action('*consultar_pedido*', async ctx => { 
    const userId = await getIdUser(ctx)
    //await getClientCode(userId, (clientCode) => {
    //    console.log(`Código cliente: ${clientCode}`)
    //    return clientCode
    //})
    ctx.reply("Seu último pedido realizado está aguardando aprovação do nosso sitema interno de recepção de pedidos")
    return
})

bot.action('*limparCarrinho*', async ctx => { 
    const userId = await getIdUser(ctx)
    
    const aftercartClear = async () => {
        addBotoesIniciais(userId, async (botoes) => {
            await ctx.reply(`Ok, esvaziei seu carrinho.`);
            await ctx.reply(`Posso te ajudar em mais alguma coisa?`, botoes);
        })
    }

    Carrinho.limparCarrinho(userId, aftercartClear)
})
bot.action('*naoLimparCarrinho*', async ctx => { 
    const userId = await getIdUser(ctx)
    
    addBotoesIniciais(userId, async (botoes) => {
        await ctx.reply(`Sem problemas.`);
        await ctx.reply(`Posso te ajudar em mais alguma coisa?`, botoes);
    })
})

bot.on('contact', async ctx => {
    const message   = ctx.update.message;
    const name      = message.from.first_name;
    const fone      = message.contact.phone_number;

    await ctx.reply(`Muito obrigado ${name}`);
    console.log(`O ${name} enviou o número -> ${fone}`)

    const userId = await getIdUser(ctx)
    await Cliente.getClientCodeByFone(
        ctx,
        userId,
        fone,
        (codClienteTotvs) => {
            ctx.reply(`Seu códigode cliente é ${codClienteTotvs}`);
        }
    );
})

const regex = new RegExp(/^\*produto\*.+/i)
bot.action(regex, async ctx => {
    const userId = await getIdUser(ctx)
    
    const keyAction = ctx.match.input
    console.log(keyAction)

    let objProd  = new ObjProduto()
    objProd.buildObject(keyAction, produtosCliente[userId]);
    
    console.log(`Produto selecionado ${objProd.codigo} - ${objProd.descricao}`);
    
    await Carrinho.setEdicaoProduto(userId, objProd.codigo)
    
    ctx.reply(`Qual a quantidade do produto '${objProd.descricao}' você quer comprar?`);
})

const regexRemoveItem = new RegExp(/^\*removerItem\*.+/i)
bot.action(regexRemoveItem, async ctx => {
    const userId = await getIdUser(ctx)
    
    const keyAction = ctx.match.input
    //console.log(keyAction)

    const partsProduto = keyAction.split("***")
    //console.log(partsProduto);
    const codProduto = partsProduto[1]
    //console.log(codProduto)

    let objProduto = new ObjProduto()
    objProduto.buildObject(`***${codProduto}`, produtosCliente[userId])
    await Carrinho.addItemCarrinho(ctx, userId, objProduto, 0)
    
})

bot.action('*consult_carrinho*', async ctx => { 
    const userId = await getIdUser(ctx)
    
    await Carrinho.verCarrinho(ctx, userId)
})

bot.action('*finalizar_pedido*', async (ctx) => { 
    const userId = await getIdUser(ctx)
    
    delete dadosPagamento[userId]
    dadosPagamento[userId] = new Array()

    const botoesFormaPagamento = Extra.markup(Markup.inlineKeyboard([
        Markup.callbackButton('À vista', '*formaPagAVista*'),
        Markup.callbackButton('Boleto', '*formaPagBoleto*')
    ], {columns: 2}));

    await ctx.reply("Muito bem, vamos fechar seu pedido.")
    await ctx.reply("Qual a forma de pagamento?", botoesFormaPagamento)
})

bot.action('*formaPagAVista*', async ctx => { 
    const userId = await getIdUser(ctx)
    dadosPagamento[userId]["forma_pagamento"] = "a_vista"
    concluirEnviarPedido(ctx, userId)
})
bot.action('*formaPagBoleto*', async ctx => { 
    const userId = await getIdUser(ctx)
    dadosPagamento[userId]["forma_pagamento"] = "boleto"

    const botoesFormaPagamento = Extra.markup(Markup.inlineKeyboard([
        Markup.callbackButton('5 dias', '*condicao_5*'),
        Markup.callbackButton('30 dias', '*condicao_30*'),
        Markup.callbackButton('60 dias', '*condicao_60*')
    ], {columns: 2}));

    await ctx.reply("Certo, qual o prazo que deseja?", botoesFormaPagamento)
})

bot.action('*condicao_5*', async ctx => { 
    const userId = await getIdUser(ctx)
    dadosPagamento[userId]["condicao_pagamento"] = "5"
    concluirEnviarPedido(ctx, userId)
})
bot.action('*condicao_30*', async ctx => { 
    const userId = await getIdUser(ctx)
    dadosPagamento[userId]["condicao_pagamento"] = "30"
    concluirEnviarPedido(ctx, userId)
})
bot.action('*condicao_60*', async ctx => { 
    const userId = await getIdUser(ctx)
    dadosPagamento[userId]["condicao_pagamento"] = "60"
    concluirEnviarPedido(ctx, userId)
})

const concluirEnviarPedido = async (ctx, telegramClientId) => {
    const userId = await getIdUser(ctx)
    await ctx.reply("Perfeito")
    await ctx.reply("Aguarde um momento enquanto envio seu pedido para Fruki.")

    Pedido.salvarPedido(ctx, telegramClientId, dadosPagamento[telegramClientId], () => {
        addBotoesIniciais(userId, (botoes) => {
            ctx.replyWithHTML('Posso te ajudar em mais alguma coisa?', botoes)
        })
    })
}

bot.startPolling()

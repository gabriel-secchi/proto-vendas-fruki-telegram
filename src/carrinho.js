const env         = require('../.env')
const redisClient = require('./redis/connect.js').redisClient
const Extra       = require('telegraf/extra')
const Markup      = require('telegraf/markup')

const botoesAfterItemCarrinho = Extra.markup(Markup.inlineKeyboard([
    Markup.callbackButton('Ver carrinho', '*consult_carrinho*'),
    Markup.callbackButton('Finalizar pedido', '*finalizar_pedido*'),
    Markup.callbackButton('Continuar comprando', '*fazer_pedido*')
], {columns: 2}));


class Carrinho {

    async setEdicaoProduto(telegramClientId, codProduto) {
        console.log(codProduto);
        redisClient.set(`${telegramClientId}_edit_prod`, codProduto, "EX", "300");
    }

    async isEdicaoProduto(telegramClientId, onSuccess) {

        redisClient.get(`${telegramClientId}_edit_prod`, (error, codProduto) => {
            if( error ) {
                console.log('Falha ao verificar se oproduto está em edição')
                console.log(error)
                return
            }
                        
            let hasProduto = false
            if( codProduto ) 
                hasProduto = true
            else 
                hasProduto = false
            
            onSuccess(hasProduto, codProduto)
        })
    }

    async addItemCarrinho(ctx, telegramClientId, objProduto, qtde) {
        await redisClient.del(`${telegramClientId}_edit_prod`)
        
        const afterGetCarrinho = async (carrinho) => {
            /* const botoesAfterItemCarrinho = Extra.markup(Markup.inlineKeyboard([
                Markup.callbackButton('Ver carrinho', '*consult_carrinho*'),
                Markup.callbackButton('Finalizar pedido', '*finalizar_pedido*'),
                Markup.callbackButton('Continuar comprando', '*fazer_pedido*')
            ], {columns: 2})); */

            if(carrinho == null) {
                carrinho = new Object
            }
            else {
                carrinho = JSON.parse(carrinho)
            }

            if(qtde == 0 ) {
                delete carrinho[objProduto.codigo]
                await ctx.reply(`O produto '${objProduto.descricao}' foi descartado do seu carrinho`, botoesAfterItemCarrinho)
            }
            else {
                const vlTotal = parseFloat(objProduto.valUnitario) * parseInt(qtde)
                const txtVlTotal = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(vlTotal)

                const txtQtde = qtde > 1 
                    ? `${qtde} volumes de ${objProduto.descricao} foram adicionados ao seu carrinho. Total ${txtVlTotal}`
                    : `${qtde} volume de ${objProduto.descricao} foi adicionado ao seu carrinho. Total ${txtVlTotal}`;

                carrinho[objProduto.codigo] = {"descricao": objProduto.descricao, "qtde": qtde, "valorUnitario": objProduto.valUnitario, "valorTotal": vlTotal}

                await ctx.reply(txtQtde, botoesAfterItemCarrinho)
            }

            redisClient.set(`${telegramClientId}_carinho`, JSON.stringify(carrinho), "EX", "43200")
        }

        this.obterCarrinho(telegramClientId, afterGetCarrinho)
    }

    async obterCarrinho(telegramClientId, onObterCarrinho) {
        await redisClient.get(`${telegramClientId}_carinho`, (error, db_carrinho) => {
            if( error ) {
                console.log('Falha ao obter carrinho')
                console.log(error)
                return
            }
            
            console.log(db_carrinho)
            onObterCarrinho(db_carrinho)
        })
    }
    
    async verCarrinho(ctx, telegramClientId) {

        await redisClient.get(`${telegramClientId}_carinho`, async (error, db_carrinho) => {
            if( error ) {
                console.log('Falha ao obter carrinho')
                console.log(error)
                return
            }
            
            if(db_carrinho == null) {
                ctx.reply("Seu carrinho está vazio")
                return
            }

            const carrinho = JSON.parse(db_carrinho);
            console.log(carrinho);

            const qtdeItensCarrinho = Object.keys(carrinho).length
            if(qtdeItensCarrinho == 0) {
                ctx.reply("Seu carrinho está vazio")
                return
            }

            let idx = 1
            let totalCarrinho = 0
            Object.keys(carrinho).forEach(async function(codProduto) {
            
                const objCarrinho = carrinho[codProduto];

                const keyButton = `*removerItem***${codProduto}`
                const botao_remover_item = Extra.markup(Markup.inlineKeyboard([
                    Markup.callbackButton(`Remover Item`, keyButton)
                ]));

                totalCarrinho += objCarrinho.valorTotal

                const txtValorTotal = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(objCarrinho.valorTotal)
                await ctx.reply(`${codProduto} - ${objCarrinho.descricao}\nVolumes: ${objCarrinho.qtde}\nValor: ${txtValorTotal}`, botao_remover_item)


                if( idx == qtdeItensCarrinho) {
                    const txtTotalCarrinho = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(totalCarrinho)
                    await ctx.reply(`Total do carrinho: ${txtTotalCarrinho}`, botoesAfterItemCarrinho)
                }

                idx += 1
            })

        })
    }

    async limparCarrinho(telegramClientId, aftercartClear) {
        await redisClient.del(`${telegramClientId}_carinho`)

        aftercartClear()
    }

    async exists(telegramClientId, onExists){
        await redisClient.exists(`${telegramClientId}_carinho`, (error, exist) => {
            if (parseInt(exist) === 1 ) {
                return onExists(true);
            } else {
                return onExists(false);
            }
        })
    }

}

module.exports = {
    getInstance: new Carrinho()
};
const env       = require('../.env')
const Cliente   = require('./cliente').getInstance
const Carrinho  = require('./carrinho').getInstance
const fs        = require('fs');

class Pedido {

    salvarPedido(ctx, telegramClientId, dadosPagamento, afterSavePedido) {
        Cliente.getClientCodeByRedis(ctx, telegramClientId, (codCliente) => {
            
            Carrinho.obterCarrinho(telegramClientId, async (carrinho) => {

                dadosPagamento["cod_cliente"] = codCliente
                await this.gerarArquivoPedido(JSON.parse(carrinho), dadosPagamento)

                await ctx.reply("Pronto!")
                await ctx.reply("Seu pedido foi concluído com sucesso")
                Carrinho.limparCarrinho(telegramClientId, () => {
                    console.log("carrinho limpo após pedido finalizado")
                    afterSavePedido()
                })
            })

        })
    }

    gerarArquivoPedido(jsonCarrinho, dadospagamento) {

        const dataFOrmatada = this.obterDataFormatada()
        const date = new Date();
        const time = date.getTime();
        const filename = `pedido_${dadospagamento["cod_cliente"]}_${dataFOrmatada}_${time}.txt`

        const codClientePreenchido = this.preencherTextoAntes(dadospagamento["cod_cliente"], 7, "0")
        const codModoPag = dadospagamento["forma_pagamento:"] == 'boleto' ? "02" : "01"

        fs.appendFile(`C:/Temp/${filename}`, `01${dataFOrmatada}${codClientePreenchido}${codModoPag}\r\n\r\n`, function (err) {
            if (err) {
                throw err;
            }
            else {
                console.log(`salvou cabecalho pedido cliente ${dadospagamento["cod_cliente"]}`);
            }
        });

        const pedidoCtx = this
        Object.keys(jsonCarrinho).forEach(async function(codProduto) {
            
            const objCarrinho = jsonCarrinho[codProduto];

            const codProdPreenchido = pedidoCtx.preencherTextoAntes(codProduto, 14, "0")
            const descProdPreenchido = pedidoCtx.preencherTextodepois(objCarrinho.descricao, 40, " ")
            const qtdeProdPreenchido = pedidoCtx.preencherTextoAntes(objCarrinho.qtde, 8, "0")

            const [partInt, partDec] = objCarrinho.valorUnitario.toString().split(".")

            const valorProdPartInt = pedidoCtx.preencherTextoAntes(partInt, 12, "0")
            const valorProdPartDec = pedidoCtx.preencherTextodepois(partDec, 5, "0")
            
            fs.appendFile(`C:/Temp/${filename}`, `0300000000EAN${codProdPreenchido}000000${descProdPreenchido}${qtdeProdPreenchido}${valorProdPartInt}${valorProdPartDec}\r\n`, function (err) {
                if (err) {
                    throw err;
                }
                else {
                    console.log(`salvou item ${codProduto}`); 
                }
            });

        })

    }

    /**
     * Obtem a data formatada no padrão YYYYMMDD
     */
    obterDataFormatada() {
        function pad(s) { return (s < 10) ? '0' + s : s; }
        var d = new Date()
        return pad(d.getFullYear()) + "" + pad(d.getMonth()+1) + "" + d.getDate();
    }

    preencherTextoAntes(value, qtdeCasas, preenchimento) {
        while(value.length > qtdeCasas) {
            value = value.substring(0, (value.length - 1))
        }

        while(value.length < qtdeCasas) {
            value = preenchimento + "" + value
        }

        return value
    }

    preencherTextodepois(value, qtdeCasas, preenchimento) {
        while(value.length > qtdeCasas) {
            value = value.substring(0, (value.length - 1))
        }

        while(value.length < qtdeCasas) {
            value = value + "" + preenchimento
        }

        return value
    }
}

module.exports = {
    getInstance: new Pedido()
};
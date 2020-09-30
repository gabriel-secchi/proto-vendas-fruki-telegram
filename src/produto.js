const env         = require('../.env')
const axios       = require('axios')

class Produto {

    obterListaProdutos(ctx, codClienteTotvs, onSuccess) {
        axios.get(`${env.urlApi}/telegram/produtos?codCliente=${codClienteTotvs}`)
        .then(async response => {
            if(response.data && response.data.length > 0)
                onSuccess(response.data);
                /* response.data.forEach(objproduto => {
                    ctx.reply(`${objproduto.descricao} :  R$${objproduto.preco}`)
                }); */
            else
                ctx.reply('Desculpe, não encontrei nenhum produto 🥺')
        })
        .catch(async error => {
            await ctx.reply('Desculpe 🥺')
            ctx.reply('parece que estamos com algumproblema em nossos servidores.Tente novamente emalguns instantes.')
        })
    }

}

module.exports = {
    getInstance: new Produto()
};
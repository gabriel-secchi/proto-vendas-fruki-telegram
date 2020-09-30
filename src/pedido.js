const env         = require('../.env')
const Cliente   = require('./cliente').getInstance
const Carrinho   = require('./carrinho').getInstance

class Pedido {

    salvarPedido(ctx, telegramClientId, dadosPagamento) {
        Cliente.getClientCodeByRedis(ctx, telegramClientId, (codCliente) => {
            
            Carrinho.obterCarrinho(telegramClientId, (carrinho) => {

            })

        })
    }

}

module.exports = {
    getInstance: new Pedido()
};
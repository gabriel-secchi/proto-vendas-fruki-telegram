const env         = require('../.env')
const redisClient = require('./redis/connect.js').redisClient
const Markup      = require('telegraf/markup')
const axios       = require('axios')

class Cliente {

    async getCodClienteRedis(telegramClientId, onSuccess) {
        if(env.mode = 'debug') {
            onSuccess('50');
            return;
        }


        redisClient.get(`${telegramClientId}_clientCode`, (error, clientCode) => {
            if( error ) {
                console.log('Falha ao obter o código do cliente')
                console.log(error)
                return
            }
             
            console.log("cliente redis", clientCode);

            if( clientCode ) {
                onSuccess(clientCode);
                return;
            }

            onSuccess(null);
        })
    }

    async getClientCodeByRedis (ctx, telegramClientId, onSuccess) { 
        await this.getCodClienteRedis(
            telegramClientId, 
            (codClienteTotvs) =>  {
                if( codClienteTotvs != null) {
                    this.salvarCodClienteRedis(telegramClientId, codClienteTotvs);
                    onSuccess(codClienteTotvs);
                    return;
                }
                else {
                    ctx.reply('Vou precisar do seu número de telefone para te identificar');
                    ctx.reply(
                        'Poderia me enviar?',
                        Markup.keyboard(
                            [{text: "📲 Enviar meu número", request_contact: true}]
                        ).removeKeyboard(true).resize().oneTime().extra()
                    )

                    redisClient.set(`${telegramClientId}_requestFone`, "TRUE", "EX", "120");
                    return;
                }
            }
        );
    }

    async getClientCodeByFone(ctx, idClienteTelegram, numTelefone, onSuccess) {

        redisClient.get(`${idClienteTelegram}_requestFone`, async (error, foiSolicitado) => {
            if( error ) {
                console.log('Falha ao obter _requestFone')
                console.log(error)
                return
            }
             
            console.log("pegar fone", foiSolicitado);

            if( foiSolicitado && foiSolicitado == "TRUE" ) {
                await axios.get(`${env.urlApi}/telegram/emitente/byfone?idTelegram=${idClienteTelegram}&fone=${numTelefone}`)
                .then(async response => {
                    console.log(response.data);
                    if(response.data && response.data.length > 0) {
                        response.data.forEach(objCliente => {
                            const codCliente = objCliente.codEmitente;
                            console.log(`Cod cliente ${codCliente}`);

                            this.salvarCodClienteRedis(idClienteTelegram, codCliente);
                            onSuccess(codCliente);
                            return
                        }); 
                    } 
                    
                    await ctx.reply('Desculpe, não encontrei seu código de cliente 🥺');
                    await ctx.reply('Entre em contato com a área comercial através do número (51) 99999-9999 para atualizar seu cadastro.');
                    ctx.reply('Até mais.');
                })
                .catch(async error => {
                    console.log(error);
                    await ctx.reply('Desculpe 🥺');
                    ctx.reply('parece que estamos com algum problema em nossos servidores.Tente novamente emalguns instantes.');
                });
            }
        })
    }

    salvarCodClienteRedis(idClienteTelegram, codClienteTotvs) {
        //redisClient.set(`${idClienteTelegram}_clientCode`, 50, "EX", "1"); //tempo de 24Hs
        redisClient.set(`${idClienteTelegram}_clientCode`, codClienteTotvs, "EX", "86400"); //tempo de 24Hs
    }
}


module.exports = {
    getInstance: new Cliente()
};
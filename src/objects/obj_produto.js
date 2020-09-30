
class ObjProduto {
    constructor() { 
        this.codigo = 0;
        this.descricao = "";
        this.valUnitario = 0.0;
    }

    buildObject(strProd, arrayDescProd) {
        //*produto**${objproduto.codigo}***${objproduto.descricao}***${valProduto}

        const partsProduto = strProd.split("***")

        console.log(partsProduto);

        this.codigo = partsProduto[1]
        try {
            this.descricao = arrayDescProd[this.codigo].descricao
            this.valUnitario = parseFloat(arrayDescProd[this.codigo].preco)
        }
        catch(ex){
            console.log(`ERROR: ${ex}`);
        }
        
    }
}

module.exports = {
    getInstance: ObjProduto
};
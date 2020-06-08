/**
 * Totalizador de carrinho de compras
 */

const PouchDB = require("pouchdb");
const PouchDBFind = require("pouchdb-find");
const bcrypt = require("bcrypt");
const fs = require("fs");

// iife - Immediately invoked function expression
(async () => {
  try {
    /**
     * Instanciando um novo objeto de "conexão"
     *
     */
    PouchDB.plugin(PouchDBFind);
    const db = new PouchDB("http://localhost:5984/couchdb-talk-2");

    /**
     * Limpando banco de dados
     */

    await Promise.all(
      (await db.allDocs()).rows.map((row) => db.remove(row.id, row.value.rev))
    );

    /**
     * Criando carrinhos
     *
     * Referencia de API: https://pouchdb.com/api.html
     */

    const carrinhoA = {
      _id: "carrinhoA",
      id: 1,
      data: new Date(),
      products: [
        {
          id: 1,
          name: "Calça",
          categoryId: 1,
          categoryName: "Vestuario",
          categoryDiscount: 0.1,
          price: 100,
        },
        {
          id: 2,
          name: "Bermuda",
          categoryId: 1,
          categoryName: "Vestuario",
          categoryDiscount: 0.1,
          price: 50,
        },
        {
          id: 3,
          name: "Meia",
          categoryId: 1,
          categoryName: "Vestuario",
          categoryDiscount: 0.1,
          price: 15,
        },
        {
          id: 4,
          name: "TV",
          categoryId: 2,
          categoryName: "Eletronicos",
          categoryDiscount: 0.05,
          price: 1000,
        },
        {
          id: 5,
          name: "Blu-ray",
          categoryId: 2,
          categoryName: "Eletronicos",
          categoryDiscount: 0.05,
          price: 250,
        },
        {
          id: 6,
          name: "Relógio",
          categoryId: 3,
          categoryName: "Joias",
          categoryDiscount: 0.2,
          price: 750,
        },
        {
          id: 8,
          name: "Geladeira",
          categoryId: 4,
          categoryName: "Linha-branca",
          categoryDiscount: 0.15,
          price: 2500,
        },
      ],
    };

    const carrinhoB = {
      _id: "carrinhoB",
      id: 2,
      data: new Date(),
      products: [
        {
          id: 9,
          name: "Cinto",
          categoryId: 1,
          categoryName: "Vestuario",
          categoryDiscount: 0.1,
          price: 30,
        },
        {
          id: 10,
          name: "Bone",
          categoryId: 1,
          categoryName: "Vestuario",
          categoryDiscount: 0.1,
          price: 100,
        },
      ],
    };

    const carrinhoC = {
      _id: "carrinhoC",
      id: 3,
      data: new Date(),
      products: [
        {
          id: 11,
          name: "Teclado",
          categoryId: 5,
          categoryName: "Informatica",
          categoryDiscount: 0.125,
          price: 80,
        },
        {
          id: 12,
          name: "Mouse",
          categoryId: 5,
          categoryName: "Informatica",
          categoryDiscount: 0.0,
          price: 30,
        },
      ],
    };

    db.bulkDocs([carrinhoA, carrinhoB, carrinhoC]);

    /**
     * Totalizador de carrinho
     */

    const totalView = await db.put({
      _id: "_design/totalizador_carrinho",
      views: {
        totalizador_carrinho: {
          map: function (doc) {
            if (doc.products) {
              for (var index in doc.products) {
                var product = doc.products[index];
                emit(doc.id, [product.categoryDiscount, product.price]);
              }
            }
          }.toString(),

          reduce: function (keys, values, rereduce) {
            if (!rereduce) {
              var total = 0;

              for (var index in values) {
                var value = values[index];                
                total += value[1] * (1 - value[0]);
              }

              return total;
            } else {
              return sum(values);
            }
          }.toString(),
        },
      },
    });

    /**
     * Consultando
     */

    const totais = await db.query("totalizador_carrinho", {
      reduce: true,
      group: true,
    });

    console.log("Totais gerais por carrinho")
    console.log(JSON.stringify(totais, null, 4));


    console.log("")
    console.log("")
    console.log("Totais gerais por carrinho e por categoria")
    /**
     * Totalizador de carrinho e categoria
     */

    const totalCategoriaView = await db.put({
      _id: "_design/totalizador_carrinho_categoria",
      views: {
        totalizador_carrinho_categoria: {
          map: function (doc) {
            if (doc.products) {
              for (var index in doc.products) {
                var product = doc.products[index];
                emit([doc.id, product.categoryId, product.categoryName], [product.categoryDiscount, product.price]);
              }
            }
          }.toString(),

          reduce: function (keys, values, rereduce) {
            if (!rereduce) {
              var total = 0;

              for (var index in values) {
                var value = values[index];                
                total += value[1] * (1 - value[0]);
              }

              return total;
            } else {
              return sum(values);
            }
          }.toString(),
        },
      },
    });

    /**
     * Consultando
     */

    const totaisCategoria = await db.query("totalizador_carrinho_categoria", {
      reduce: true,
      group: true,
    });

    console.log(JSON.stringify(totaisCategoria, null, 4));
  } catch (err) {
    console.error(err, err.stack);
  }
})();

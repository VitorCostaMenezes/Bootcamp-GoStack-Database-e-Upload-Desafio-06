import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';

// criando uma interface
interface CSVTransactions {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  // recuperando o o FilePath  via parâmetro
  async execute(filePath: string): Promise<Transaction[]> {
    // instanciando o repositorio
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // a stream que esta lendo os aqrquivos recebeidos por uplaod
    // ficando armazenada na const abaixo
    // o readAtream vai ler o FilePath
    const contactsReadStream = fs.createReadStream(filePath);

    // instanciando o csv parsers
    const parsers = csvParse({
      // ele vai ler o arquivo a partir da segunda linha
      from_line: 2,
    });

    // o pipe vai ler as linhas conforme eles estivrem diponiveis
    // como na função anterios cvs parse ficou o arquivo retrnou a leitura a partur da line 2
    // nessa funão ele vai ler os 3 arquivos presents no arquivo linha a linha
    const parseCSV = contactsReadStream.pipe(parsers);

    // definindo que transactions é um array do tipo CSVtransactions
    const transactions: CSVTransactions[] = [];
    // Definindo que categories é um array de string
    const categories: string[] = [];

    // o on é uma especie de map
    // recebe dois parâmetros
    // o data é o proprio dados
    // o segundo parâmetro e uma calback
    parseCSV.on('data', async line => {
      // pra cada linha ele vai estar desestruturando aproprieadades abaixo
      const [title, type, value, category] = line.map((cell: string) =>
        // remove espaçoes em branco no inicio e no fim de um texto
        cell.trim(),
      );

      // verificando se um dos elementos não retornou
      // se umd eles não existir ele retorna
      if (!title || !type || !value) return;

      // da um push no array categories com as informações de category
      categories.push(category);

      // da um push em transactions com odas as informações
      transactions.push({ title, type, value, category });
    });

    // como a função acima executa um metodo assincrono, nãos eria possivel
    // ja recuperar as informações
    // a utilização do resolve esperar a finalização do evento
    // nesse caso ele espera o end.
    // em requestAnimationFrame, isso faz com que os demais códigos esperem
    // a execução do metodo ON no parseCVS se concretizar
    await new Promise(resolve => parseCSV.on('end', resolve));

    // busca pelas categorias existentes no banco
    // através do metodo In   ele verifica se algumas das categorias
    // presentees em categories esta no banco de dados
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });
    // retorna um array com apenas o title das categorias
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    // verificando as categorias que não existem no banco de dados
    // retorna todas as categories não existentes no banco
    // o segundo filter mapeia novamente o conteudo e filtra o elemento
    // em que o self.indexOf(value) seja igual ao index
    // isso evita repetição de categorias
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    // criando o objeto com as categorias novas
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    // salvando no banco
    await categoriesRepository.save(newCategories);

    // criar um novo array contendo as cvategorias ja existentes
    // e as categorias novas
    const finalCategories = [...newCategories, ...existentCategories];

    // cria o objeto
    const createdTransactions = transactionRepository.create(
      // mapoeia o transactions para exibir cada um do elemntos
      // a cada loop do map ele inserve todas as categorias abaixo
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    // salvando no banco
    await transactionRepository.save(createdTransactions);

    // deletando o arquivo
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;

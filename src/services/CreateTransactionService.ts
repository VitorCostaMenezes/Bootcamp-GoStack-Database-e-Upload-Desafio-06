import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // instanciando o reposiorio, a partir de agora ele terá acesso aos metodos
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // cria um repositporio passando a model de Category
    const categoryRepository = getRepository(Category);

    // acessando o valor do  total obtido pelo get balance
    // ja desconstruido
    const { total } = await transactionsRepository.getBalance();

    // verifica se o type da operação é outcome e se o value é maior que o total
    // caso retorne true ele gera um erro
    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    // busca no repositório category se existe algum arquivo que ja possua
    // o mesmo title recebido e armazena em transactionCategory
    let transactionCategory = await categoryRepository.findOne({
      // comopara se existe algum registro igual a category
      where: {
        title: category,
      },
    });

    // se transactionCategory não existir
    // é criado um novo objeto que receberá o parâmetro category como title
    // depois será salvo no banco de dados na tabala category
    if (!transactionCategory) {
      // criando um objeto
      transactionCategory = categoryRepository.create({
        title: category,
      });
      // salvando o objeto criado no banco de dados
      await categoryRepository.save(transactionCategory);
    }

    // criando um objeto
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });
    // inserindo o bjeto criado (transaction) no banco de dados
    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

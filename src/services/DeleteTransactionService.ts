import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    // instanciando o repositoório
    const transactionsRepository = getCustomRepository(TransactionRepository);

    // verificando se existe algum registro que possui o mesmo id
    // e armazenando  em transaction
    const transaction = await transactionsRepository.findOne(id);

    // se não exixtir nenhum registor com o mesmo id
    // retorna um erro
    if (!transaction) {
      throw new AppError('Transactions does not exist');
    }

    // caso exista um registro com o mesmo id
    // esse registor é deletado pelo metodo remove do Typeorm
    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;

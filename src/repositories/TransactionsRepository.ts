import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

// criando a interface do balance
interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // recuperando todas as transações
    // como ja esta dentro do repository, pode usar o this para referenciar
    // o proprio repositorio, em vez d eusar um getCustomrepository
    // o metood find foi utilizado sem receber nennhum parâmetro par retornar tudo
    const transactions = await this.find();

    // foi utilzido reduce para asumular os valores em income e outcome
    const { income, outcome } = transactions.reduce(
      (accumulator, transaction) => {
        switch (transaction.type) {
          // para ocaso do type ser igual a income o valor é acumulado em income
          case 'income':
            // como o value retorna uma string, foi necessário converter para number
            // para pdoer se efetuar uma operação matematica
            accumulator.income += Number(transaction.value);
            break;

          // para ocaso do type ser igual a outcome o valor é acumulado em outcome
          case 'outcome':
            accumulator.outcome += Number(transaction.value);
            break;

          default:
            break;
        }

        return accumulator;
      },
      {
        // especificando os valores iniciais das variaveis
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    // subtraindo o valor do income pelo outcome
    const total = income - outcome;

    // retornando os valores do balance
    return { income, outcome, total };
  }
}

export default TransactionsRepository;

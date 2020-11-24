import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

// importando as configurações de upload
import uploadConfig from '../config/upload';
import ImportTransactionsService from '../services/ImportTransactionsService';

// instanciando o multer e passando a configuração de upload
const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  // instanciando o repositorio
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  // buscando o conteudo do reositorio
  // como não foi passado nenhum parâmetro no find ele retorna tudo
  const transactions = await transactionsRepository.find();

  // acessando o metodo balance para obter o balanço das transações
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  // recuperando os dados do body
  const { title, value, type, category } = request.body;
  // instanciando a classe
  const createTransaction = new CreateTransactionService();
  // acessando o metodo execute, que neste caso esta resposável pelas regras de  negocio
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  // desestruturando o di recuperado da url
  const { id } = request.params;

  // instanciando a classe Deelete Transactions
  const deleteTransaction = new DeleteTransactionService();

  // acessando o metod execute
  // esse metodo esta presente no service DeleteTransaction
  await deleteTransaction.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    // instanciando o service
    const importTransactions = new ImportTransactionsService();

    // acessando o metodo execute presnete no service
    // passando o oarquivo de uload recuperado pelo request como parâmetro
    const transactions = await importTransactions.execute(request.file.path);

    return response.json(transactions);
  },
);

export default transactionsRouter;

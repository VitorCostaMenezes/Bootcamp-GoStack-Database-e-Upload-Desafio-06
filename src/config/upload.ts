// o path serve para passar o caminho que serve para qualquer sistema operacional
import path from 'path';
// o cryptoserve para gerar hashs e criptografias
import crypto from 'crypto';
import multer from 'multer';

// o _dirname se refere ao próprio diretório em que este arquivo esta
// no caso a pasta config,
// depois deve-se adicionar o caminho até o diretório desejado
// as virgulas contam como se fossem /
// porém, como alguns sistemas podems ter / ou \ e etc
// o exemplo abaixo simula o caminho ../../tmp
// o caminho é armazenado na const tmpFolder
const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,

  // o diskstorage recebe duas proprieadades, o destination e o filename
  // destinatio é o local aonde vc deseja salvar o arquivo
  // neste caso a pasta tmp fora do src
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      // gera um código de 10Bytes aleatório
      // depois converte em uma string hexadecimal
      // e armazena em filehash
      const filehash = crypto.randomBytes(10).toString('hex');
      // cria um novo nome para file juntando o filehash
      // com o file.originalName
      // o originalName é um atributo nativo(não foi preciso criar)
      const fileName = `${filehash}-${file.originalname}`;

      // retorna um valor nulo ou o filename
      return callback(null, fileName);
    },
  }),
};

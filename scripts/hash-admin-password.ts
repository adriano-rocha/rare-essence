import { criarHashSenhaAdmin } from '../src/modules/admin/infra/senha-scrypt';

async function lerSenhaOculta(): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error('Execute o comando em um terminal interativo.');
  }

  return new Promise((resolve, reject) => {
    let senha = '';
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    process.stdout.write('Nova senha (mínimo 12 caracteres): ');

    const aoDigitar = (caractere: string) => {
      if (caractere === '\u0003') {
        stdin.setRawMode(false);
        stdin.pause();
        reject(new Error('Operação cancelada.'));
        return;
      }
      if (caractere === '\r' || caractere === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', aoDigitar);
        process.stdout.write('\n');
        resolve(senha);
        return;
      }
      if (caractere === '\u0008' || caractere === '\u007f') {
        senha = senha.slice(0, -1);
        return;
      }
      senha += caractere;
    };

    stdin.on('data', aoDigitar);
  });
}

async function main() {
  const senha = await lerSenhaOculta();
  if (senha.length < 12) {
    throw new Error('A senha deve ter ao menos 12 caracteres.');
  }
  process.stdout.write(`${await criarHashSenhaAdmin(senha)}\n`);
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : 'Falha ao gerar hash.');
  process.exitCode = 1;
});

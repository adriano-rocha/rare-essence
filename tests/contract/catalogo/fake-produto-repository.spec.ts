import { FakeProdutoRepository } from '@/modules/catalogo/infra/fake-produto-repository';
import { runProdutoRepositoryContractTests } from './produto-repository.contract';

runProdutoRepositoryContractTests('FakeProdutoRepository', () => {
  return new FakeProdutoRepository();
});
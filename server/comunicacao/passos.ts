import { PASSOS } from '../processos/rotina.ts';
import type { PassoRotina } from '../processos/rotina.ts';
import { entregarMensagens } from './entrega.ts';
import { gerarMensagens } from './gerador.ts';
import type { ProvedorEmail } from './provedor.ts';

/**
 * Passos completos da rotina (AGT-015): os quatro de situacao (AGT-014) e, depois deles, a geracao dos avisos e a entrega dos e-mails,
 * para uma mesma execucao ja cobrir o que acabou de mudar. Usados pela API e pelo comando `npm run rotina`.
 */
export function passosDaRotina(provedor: ProvedorEmail | undefined): readonly PassoRotina[] {
  return [
    ...PASSOS,
    { nome: 'avisos_gerados', rotulo: 'avisos gerados', executar: (db, agora) => gerarMensagens(db, agora) },
    {
      nome: 'emails_enviados',
      rotulo: 'e-mails enviados',
      // A entrega abre uma transacao por mensagem.
      semTransacao: true,
      executar: (db, agora) => {
        const r = entregarMensagens(db, provedor, agora);
        return { alterados: r.enviadas, avisos: r.falhas === 0 ? [] : [`e-mails com falha nesta execução: ${r.falhas} (definitivas: ${r.definitivas})`] };
      },
    },
  ];
}

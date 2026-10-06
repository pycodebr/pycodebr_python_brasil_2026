# Laboratório: revisão antes de merge e deploy

Simulador **totalmente local**, em Python 3.10+ e biblioteca padrão. Não precisa
instalar pacotes, configurar Hermes, acessar serviços ou informar credenciais.
Todos os reports, PRs, notificações e releases são fictícios, mantidos somente
na memória. Rodar o programa não cria PR, não envia mensagem e não faz deploy.

## Executar

Na raiz do repositório:

```bash
python3 -B exemplos/fluxo_revisao.py
python3 -B exemplos/fluxo_revisao.py --scenario all
python3 -B -m unittest discover -s testes -p 'test_fluxo_revisao.py' -v
```

`-B` evita arquivos de bytecode; não é necessário para o simulador funcionar.
A CLI imprime JSON com `simulation: true`, estado final, motivo do bloqueio e
histórico de etapas. Sem argumentos, executa `happy_path`, termina com
`state: resolved`, `report_status: resolved` e `blocked_reason: null`.
Nos cenários de bloqueio, saída zero significa **demonstração concluída**, não
aprovação da mudança. Leia `state` e `blocked_reason`. Argumento desconhecido
é rejeitado pela CLI.

## O percurso

```text
report → triagem → mudança → testes → PR → notificação
       → aprovação explícita → merge → leitura do merge
       → deploy → versão + teste funcional
       → escrita de resolved → leitura do report → confirmação fictícia
```

- Um bug exige reprodução e escopo; uma feature exige escopo e critérios.
- `record_tests(passed=True)` representa evidência de CI **simulada**. Os testes
  `unittest`, por outro lado, executam código real deste laboratório.
- Notificação entregue não é aprovação. Silêncio, emoji, resposta ambígua,
  outro ator ou aprovação de versão antiga não autorizam merge.
- `approve(actor="reviewer", decision="approve", commit_id="commit-a")`
  representa uma decisão humana fictícia vinculada ao PR deste objeto e à
  versão atual. `reviewer` é só um identificador didático, **não autenticação**.
- `commit-a` e `commit-b` **não são SHAs nem hashes reais**. Representam o papel
  do head SHA na aprovação. `change("commit-b")` invalida testes, notificação e
  aprovação; exige novo ciclo de testes e revisão antes do merge.
- O modelo simplifica merge como fast-forward: versão aprovada, integrada e
  implantada têm o mesmo identificador. Sistemas reais devem registrar também
  o commit resultante do merge e a identidade do artefato implantado.
- Sucesso de uma escrita não basta: os estados `*_unconfirmed` exigem leitura
  do alvo. Deploy exige a versão certa **e** o critério funcional passando;
  apenas um healthcheck positivo não comprovaria a correção.
- Deploy falho mantém o report `in_progress`. `resolved` só é confirmado após
  validação funcional e leitura do status escrito no report.
- Resultado de escrita `ambiguous` bloqueia repetição cega. Primeiro confira
  o alvo; se a leitura também for inconclusiva, pare e escale. O exemplo não
  implementa retentativa automática ou recuperação de produção.

## Comparar cenários

```bash
python3 -B exemplos/fluxo_revisao.py --scenario stale_approval
python3 -B exemplos/fluxo_revisao.py --scenario failed_deploy
python3 -B exemplos/fluxo_revisao.py --scenario ambiguous_write
```

| Cenário | Resultado didático |
| --- | --- |
| `happy_path` / `feature` | Report resolvido após todas as confirmações |
| `failed_tests` | Testes bloqueiam abertura do PR |
| `silent_approval` / `ambiguous_approval` | Continua esperando aprovação |
| `notification_failed` | Entrega não confirmada bloqueia aprovação |
| `stale_approval` | Novo commit invalida a aprovação anterior |
| `failed_deploy` | Deploy falhou; report continua pendente |
| `ambiguous_write` | Merge inconclusivo; repetir a escrita é bloqueado |
| `mismatched_readback` | Leitura do merge não confirma a versão aprovada |

**Experimento:** no cenário `stale_approval`, localize a aprovação de `commit-a`
e a mudança para `commit-b`. Por que `approved_commit` termina vazio? Compare
com `test_change_invalidates_tests_notification_and_approval`, que refaz os
testes, solicita nova aprovação e confirma o merge de `commit-b`.

## Limites

Os argumentos de testes, entrega e readback são entradas determinísticas,
fornecidas pelo roteiro, não consultas externas. O objeto modela um report,
um PR e um ambiente; não é um executor seguro para produção. Não implementa
proteções de branch, autenticação, locks, filas, migrações ou rollback. Esses
controles exigiriam componentes e permissões reais, separados por função.
O laboratório demonstra gates e estados; não comprova uma integração implantada.

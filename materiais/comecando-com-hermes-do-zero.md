# Começando com Hermes do zero

Este guia acompanha a palestra de Felipe Azambuja, professor e fundador da PycodeBR, na Python Brasil 2026. A ideia é sair da palestra e montar, no seu computador, um agente Hermes funcionando: instalado, ligado a um provedor de modelo, com memória e skills, conectado a ferramentas externas por MCP e Composio e apoiado por uma base de contexto em Markdown versionada em Git. O Hermes Agent é um projeto open source (licença MIT) criado pela Nous Research e mantido junto com a comunidade. O Felipe usa a ferramenta no dia a dia e ensina a operá-la, mas a autoria do projeto pertence à Nous Research e aos contribuidores.

Pré-requisitos:

- Linux, macOS ou Windows com WSL2 (a documentação também traz instalação nativa para Windows e um app desktop, que este guia não cobre);
- um terminal e familiaridade com comandos básicos;
- Git instalado e uma conta no GitHub, GitLab ou serviço equivalente para guardar a base de contexto em um repositório **privado**;
- uma conta em um provedor de modelo (Nous Portal, OpenRouter, Anthropic, OpenAI e outros), com cobrança ativa ou assinatura.

Se você quiser entender antes como as peças se encaixam, leia também a [arquitetura e operação](./arquitetura-operacao.md) e o [guia da palestra](./guia-da-palestra.md).

## 1. Instalar o Hermes

No Linux, no macOS e no WSL2, a instalação de linha de comando usa o script oficial:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

Antes de rodar um `curl | bash`, vale abrir a URL no navegador e ler o script, porque ele vai executar com o seu usuário. O instalador clona o código em `~/.hermes/hermes-agent/`, cria o comando `hermes` em `~/.local/bin/` e guarda os seus dados em `~/.hermes/`. Em uma execução interativa, ele também chama o assistente de configuração.

Quando terminar, recarregue o shell e confira se está tudo certo:

```bash
source ~/.bashrc   # ou: source ~/.zshrc
hermes doctor
```

O `hermes doctor` diagnostica problemas de configuração e dependências. Se ele apontar algo, resolva antes de seguir, porque cada camada que você adicionar depois depende de uma base saudável. A página de [instalação](https://hermes-agent.nousresearch.com/docs/getting-started/installation) traz as opções avançadas, a tabela de onde cada coisa fica e a seção de solução de problemas.

## 2. Escolher o modelo e o provedor

Essa é a etapa que mais influencia o resultado e o custo. Rode, no terminal e fora de qualquer conversa:

```bash
hermes model
```

O `hermes model` é o assistente completo: adiciona provedores, faz login por OAuth, pede chaves de API e salva o modelo padrão. Dentro de uma conversa, o comando `/model` apenas alterna entre modelos que você já configurou. Se preferir passar por todas as opções de uma vez, use `hermes setup`; a documentação também oferece `hermes setup --portal`, que faz login no Nous Portal e ativa as ferramentas do Tool Gateway da Nous com uma única assinatura.

Três pontos para observar nessa escolha:

- o Hermes exige um modelo com pelo menos 64 mil tokens de contexto, e modelos menores são recusados na inicialização;
- as chaves e os tokens ficam em `~/.hermes/.env`, enquanto as configurações sem segredo ficam em `~/.hermes/config.yaml`;
- você pode trocar de provedor depois com `hermes model`, então comece com um que você já conhece e cuja cobrança consegue acompanhar.

A lista completa de provedores, com as variáveis de ambiente de cada um, está na página de [provedores](https://hermes-agent.nousresearch.com/docs/integrations/providers). Para ajustes finos, consulte a página de [configuração](https://hermes-agent.nousresearch.com/docs/user-guide/configuration).

## 3. Primeira conversa e /help

Abra o Hermes:

```bash
hermes          # interface clássica
hermes --tui    # interface TUI, recomendada pela documentação
```

O banner inicial mostra o modelo, as ferramentas e as skills disponíveis. Comece por uma pergunta simples e conferível, e só avance quando a conversa funcionar por mais de uma rodada. A própria documentação recomenda não adicionar recursos enquanto o chat básico não estiver estável.

Os comandos de barra que você vai usar logo no início:

| Comando | Para que serve |
| --- | --- |
| `/help` | Lista os comandos disponíveis, agrupados por categoria |
| `/new` | Abre uma sessão nova, com histórico vazio (o alias é `/reset`) |
| `/model` | Mostra ou troca o modelo entre os que já estão configurados |
| `/skills` | Busca, instala e inspeciona skills (no terminal) |
| `/tools` | Lista as ferramentas disponíveis na sessão |

Para retomar a última conversa depois de fechar o terminal, use `hermes --continue` (ou `hermes -c`). Se você precisar interromper o agente no meio de uma tarefa, digite uma nova mensagem e pressione Enter, ou use `Ctrl+C`. As referências completas estão em [comandos de barra](https://hermes-agent.nousresearch.com/docs/reference/slash-commands) e [comandos da CLI](https://hermes-agent.nousresearch.com/docs/reference/cli-commands).

## 4. Primeiros prompts

Os prompts abaixo seguem uma ordem pensada para você ganhar confiança aos poucos. Cada um pede uma verificação no final e deixa explícito o que o agente não deve fazer. Ajuste os caminhos e os nomes para a sua máquina e leia com atenção os comandos que o Hermes propõe antes de aprovar qualquer um.

**Prompt 1: apresentar-se e registrar preferências na memória**

```text
Meu nome é <seu nome>, trabalho com <sua área> e uso principalmente Python.
Prefiro respostas em português, diretas, com os comandos que você executou.
Guarde na sua memória apenas essas preferências, em entradas curtas.
Depois me mostre exatamente o que foi salvo e em qual memória (usuário ou agente).
```

**Prompt 2: inspecionar um projeto local sem alterar nada**

```text
Analise o projeto em ~/projetos/<nome-do-projeto> somente em modo leitura.
Não crie, não edite e não apague nenhum arquivo, e não instale dependências.
Explique a estrutura de pastas, o ponto de entrada, como os testes são executados
e quais arquivos de configuração existem. Liste os comandos que você rodou.
```

**Prompt 3: criar a base de contexto com índice e AGENTS.md**

```text
Crie uma base de contexto em ~/base-contexto seguindo esta estrutura:
README.md como índice, AGENTS.md com as regras de operação e as pastas
Pessoal, Trabalho, Projetos e Rotinas, cada uma com um README.md curto.
Inicialize o Git, mas não crie remoto, não faça commit e não faça push.
No final, mostre a árvore de arquivos e o conteúdo do README.md e do AGENTS.md
para eu revisar antes do primeiro commit.
```

**Prompt 4: corrigir um bug pequeno, rodando os testes e mostrando o diff**

```text
No projeto ~/projetos/<nome-do-projeto>, o teste <nome_do_teste> está falhando.
Rode primeiro a suíte de testes e me mostre a falha. Depois proponha a menor
correção possível, aplique, rode os testes de novo e mostre o diff completo.
Não faça commit, não altere outros testes e não atualize dependências.
```

**Prompt 5: transformar o procedimento validado em skill**

```text
O procedimento que usamos para corrigir aquele bug funcionou.
Transforme-o em uma skill chamada "corrigir-bug-com-testes", com os passos,
os cuidados e a forma de verificar o resultado. Mostre o SKILL.md antes de salvar.
Depois de salvar, confirme o caminho do arquivo e me diga como invocar a skill.
```

**Prompt 6: pesquisar documentação e resumir com fontes**

```text
Pesquise na documentação oficial do Hermes Agent como funcionam os context files
(AGENTS.md, SOUL.md e a ordem de prioridade entre eles).
Resuma em até 10 linhas e coloque o link da página usada em cada afirmação.
Se alguma informação não estiver na documentação, diga isso em vez de supor.
```

**Prompt 7: ler a agenda de amanhã pelo Composio, sem enviar nada**

```text
Usando o Composio, leia os eventos da minha agenda Google de amanhã.
Esta tarefa é somente de leitura: não crie, não altere e não apague eventos,
não envie convites, e-mails nem mensagens.
Prepare um resumo com horário, título e participantes de cada evento e indique
qual ferramenta do Composio você usou. Se a conexão com a agenda não existir,
me mostre o link de autorização e espere eu confirmar.
```

**Prompt 8: agendar uma rotina que gera um relatório local**

```text
Crie uma tarefa agendada para todos os dias úteis às 8h que liste os arquivos
alterados nas últimas 24 horas em ~/base-contexto e salve um relatório em
~/base-contexto/Rotinas/relatorios/AAAA-MM-DD.md. A rotina não deve enviar
mensagens nem fazer commit. Antes de criar, me mostre o agendamento e o prompt
da tarefa. Depois de criar, mostre a saída de "hermes cron list".
```

O prompt 7 só funciona depois do passo 7 deste guia, e o prompt 8 depende do agendador ativo, como explicado no passo 9.

## 5. Memória e skills

O Hermes guarda o que aprende em três lugares diferentes, e entender a diferença evita bagunça.

A **memória** fica em `~/.hermes/memories/`, em dois arquivos: `MEMORY.md`, com notas do agente sobre ambiente e convenções (limite de 2.200 caracteres), e `USER.md`, com o seu perfil e as suas preferências (limite de 1.375 caracteres). Esses arquivos entram no prompt de sistema no início de cada sessão, então uma alteração feita no meio da conversa só aparece na sessão seguinte. Como a memória é enviada em todas as conversas, ela deve conter fatos curtos e estáveis. Para revisar escritas pendentes quando a aprovação de memória estiver ligada, use `/memory`. O comando `hermes memory status` mostra qual provedor de memória externa está configurado; a memória embutida fica sempre ativa.

As **skills** ficam em `~/.hermes/skills/`. Cada skill é um arquivo `SKILL.md` com nome, descrição e um procedimento passo a passo. O agente lê apenas as descrições curtas e carrega o conteúdo completo quando a tarefa pede, por isso ter várias skills instaladas não pesa em toda requisição. Ele também pode criar e melhorar skills a partir do que deu certo, como você fez no prompt 5. Para administrar as skills pelo terminal:

```bash
hermes skills list                 # skills instaladas
hermes skills browse               # catálogo dos registros
hermes skills search <termo>       # busca por palavra-chave
hermes skills inspect <slug>       # visualiza antes de instalar
hermes skills install <slug>       # instala, com verificação de segurança antes
```

Toda skill instalada vira um comando de barra, então uma skill chamada `corrigir-bug-com-testes` pode ser chamada com `/corrigir-bug-com-testes`.

A **base de contexto**, que você cria no próximo passo, guarda o que não cabe na memória: decisões, detalhes de projetos, fontes e histórico. Uma divisão que funciona bem é esta:

| Onde | O que guardar | Exemplo |
| --- | --- | --- |
| Memória do Hermes | Fatos curtos e estáveis | "Prefere respostas em português; a base fica em ~/base-contexto" |
| Base de contexto | Detalhes, decisões e fontes | Nota do projeto com arquitetura, links e histórico de decisões |
| Skills | Procedimentos testados e revisados | Passo a passo para corrigir bug com testes e mostrar diff |

Em todos esses casos, o aprendizado fica registrado em arquivos que você pode ler, versionar e corrigir. Os pesos do modelo continuam os mesmos, e é por isso que vale revisar o que o agente grava: se uma memória ou uma skill estiver errada, o erro se repete até alguém corrigir o arquivo. Os detalhes estão nas páginas de [memória](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) e de [skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

## 6. Criar a base de contexto

A abordagem que o Felipe ensina é uma pasta de arquivos Markdown versionada em um repositório Git **privado**. Pode ser um vault do Obsidian, se você já usa, ou só uma pasta comum. O que importa é ter um índice que explique onde está cada coisa, pastas separadas por domínio e um `AGENTS.md` na raiz com as regras que o agente deve seguir ali dentro.

Um exemplo de árvore para começar:

```text
base-contexto/
├── AGENTS.md              # regras para o agente nesta pasta
├── README.md              # índice: o que existe e onde está
├── Pessoal/
│   └── README.md
├── Trabalho/
│   └── README.md
├── Projetos/
│   ├── README.md
│   └── meu-projeto.md
└── Rotinas/
    ├── README.md
    └── relatorios/
```

E um `AGENTS.md` de exemplo, que você deve adaptar ao seu caso:

```markdown
# Regras para agentes nesta base

## Antes de agir
- Leia o README.md (índice) e abra apenas as notas pertinentes à tarefa.
- Com a árvore de trabalho limpa, execute `git pull --ff-only` antes de consultar ou alterar.
- Se houver alterações locais que você não fez, pare e me avise.
  Não use stash, reset ou checkout para descartá-las.

## Ao alterar
- Faça mudanças pequenas e mostre o diff antes do commit.
- Atualize o README.md sempre que criar, mover ou renomear uma nota.
- Depois de revisar o diff, faça commit com mensagem descritiva e push para o remoto privado.
- Nunca use force-push.

## Segurança
- Nunca grave senhas, tokens, chaves de API, códigos de verificação ou dados de cartão nesta base.
- Segredos ficam em ~/.hermes/.env ou no gerenciador de senhas.
- Não envie mensagens, e-mails ou convites sem a minha confirmação explícita.

## Onde guardar cada coisa
- Fatos curtos e estáveis sobre mim: memória do Hermes.
- Detalhes, decisões e fontes: notas desta base, com o link da fonte.
- Procedimentos testados: skills do Hermes, citando a nota de origem quando houver.
```

O Hermes carrega o `AGENTS.md` da pasta em que você inicia a sessão e, dentro de um repositório Git, a cadeia de `AGENTS.md` da raiz do repositório até a pasta atual. Fora de um repositório, ele olha apenas a pasta atual. Por isso, há dois jeitos práticos de usar a base:

1. abrir o Hermes de dentro dela (`cd ~/base-contexto && hermes`) quando a tarefa for sobre as suas notas;
2. registrar na memória um fato curto apontando o caminho, por exemplo "A base de contexto fica em ~/base-contexto; consulte o README.md antes de tarefas pessoais ou de trabalho", para que o agente saiba onde procurar quando você estiver em outro diretório.

Para publicar a base em um repositório privado, crie o repositório no seu serviço Git marcando a visibilidade como privada e, depois de revisar os arquivos que o agente gerou no prompt 3:

```bash
cd ~/base-contexto
git add .
git commit -m "Cria estrutura inicial da base de contexto"
git branch -M main
git remote add origin <URL-do-seu-repositorio-privado>
git push -u origin main
```

A documentação de [context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files) explica a ordem de prioridade entre `.hermes.md`, `AGENTS.md`, `CLAUDE.md` e os demais arquivos. Ela também descreve o `SOUL.md`, que fica em `~/.hermes/SOUL.md` e define o tom padrão do agente em todas as sessões; a página de [personalidade e SOUL.md](https://hermes-agent.nousresearch.com/docs/user-guide/features/personality) traz exemplos.

## 7. Conectar ferramentas: toolsets, MCP e Composio

### Toolsets

As ferramentas embutidas do Hermes (terminal, arquivos, web, navegador, memória, agendamento e outras) são organizadas em toolsets que você liga e desliga por plataforma:

```bash
hermes tools
```

Comece com o mínimo que a sua tarefa exige e vá liberando conforme a necessidade. Menos ferramentas ativas significam menos texto no prompt e menos chance de o agente usar algo que você não queria. A página de [ferramentas e toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools) lista as categorias.

### Servidores MCP

O MCP (Model Context Protocol) permite conectar o Hermes a servidores externos que expõem ferramentas. Os comandos principais são:

```bash
hermes mcp                                    # catálogo interativo de MCPs aprovados pela Nous
hermes mcp add <nome> --url <URL> --auth oauth   # servidor HTTP com OAuth
hermes mcp add <nome> --command <cmd> --args ... # servidor local (stdio); --args vai por último
hermes mcp list                               # servidores configurados
hermes mcp test <nome>                        # testa a conexão
```

Os servidores ficam registrados na seção `mcp_servers` do `~/.hermes/config.yaml`. Dentro de uma sessão, `/reload-mcp` recarrega os servidores sem reiniciar o Hermes. Dois cuidados ajudam bastante: guardar tokens no `~/.hermes/.env` e referenciá-los no `config.yaml` como `${NOME_DA_VARIAVEL}`, e usar os filtros `tools.include` e `tools.exclude` para expor apenas as ferramentas que você pretende usar. As ferramentas aparecem para o agente com o prefixo `mcp_<servidor>_<ferramenta>`. Veja a página de [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp), o guia prático [Use MCP with Hermes](https://hermes-agent.nousresearch.com/docs/guides/use-mcp-with-hermes) e a [referência de configuração](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference).

### Composio

O Composio é uma plataforma que conecta agentes a mais de mil aplicativos, segundo a própria documentação (Gmail, Google Calendar, GitHub, Notion, Slack e outros) e cuida do OAuth, da renovação de tokens e dos escopos de cada conta. O próprio Composio mantém um [guia de integração com o Hermes](https://composio.dev/toolkits/composio/framework/hermes-agent) que descreve dois caminhos, CLI e MCP, e recomenda a CLI para uso pessoal. Para quem usa Claude Code, existe também o [plugin oficial do Composio para Claude Code](https://docs.composio.dev/docs/claude-code-plugin).

O primeiro passo, nos dois caminhos, é criar uma conta no [Composio](https://composio.dev) e acessar o [dashboard](https://dashboard.composio.dev). Confira também os planos e limites de uso na página do Composio antes de conectar contas de trabalho.

**Caminho A: CLI do Composio chamada pelo terminal do Hermes**

Instale a CLI com o script da [documentação da CLI](https://docs.composio.dev/docs/cli), abra um terminal novo e faça login:

```bash
curl -fsSL https://composio.dev/install | sh
composio --version
composio login
```

O instalador também tenta configurar plugins para Claude Code e Codex quando encontra essas ferramentas na máquina; a documentação explica como desativar isso com `COMPOSIO_INSTALL_PLUGINS=0` ou `--no-plugins`. Depois do login, o fluxo básico tem quatro comandos:

```bash
composio search "eventos da minha agenda de amanhã"   # encontra a ferramenta certa
composio execute <SLUG_DA_FERRAMENTA> --get-schema    # mostra os parâmetros de entrada
composio link gmail                                   # conecta a conta do app (abre o OAuth)
composio execute <SLUG_DA_FERRAMENTA> -d '{ ... }'    # executa a ferramenta
```

Use `composio search` para descobrir o nome exato do app e da ferramenta que você precisa, como a agenda do Google, em vez de chutar o identificador. Como o Hermes executa comandos no terminal, ele consegue usar a CLI diretamente. Para que isso aconteça sempre do mesmo jeito, peça ao agente uma skill que documente esse fluxo (buscar, conferir o schema, conectar e executar) e que estabeleça uma regra: ações de escrita, como enviar e-mail ou criar evento, só depois da sua confirmação.

**Caminho B: servidor MCP do Composio (Composio Connect)**

O [Composio Connect](https://docs.composio.dev/docs/composio-connect) é um servidor MCP em `https://connect.composio.dev/mcp`. Em vez de expor cada ferramenta de cada app, ele oferece sete meta-ferramentas que buscam ferramentas, gerenciam conexões OAuth e executam ações. Na primeira vez que o agente precisar de um app, o Composio gera um link de autorização para você aprovar no navegador.

O guia do Composio para o Hermes orienta copiar a URL do Connect MCP e a chave de API no dashboard e adicionar o servidor ao `~/.hermes/config.yaml`. Uma forma de fazer isso mantendo a chave fora do arquivo de configuração é gravá-la no `~/.hermes/.env` (por exemplo, como `COMPOSIO_CONSUMER_API_KEY`, nome que você escolhe) e referenciá-la assim:

```yaml
mcp_servers:
  composio:
    url: "https://connect.composio.dev/mcp"
    headers:
      x-consumer-api-key: "${COMPOSIO_CONSUMER_API_KEY}"
    connect_timeout: 60
    timeout: 180
```

Depois, teste a conexão e reinicie a sessão (ou use `/reload-mcp`):

```bash
hermes mcp test composio
```

Os nomes de cabeçalho e de campos acima seguem o guia do Composio para o Hermes no momento em que este material foi escrito. Se a página do dashboard indicar outro formato, siga o que estiver lá.

Com qualquer um dos dois caminhos funcionando, rode o prompt 7 da seção 4 e confira se o resumo bate com a sua agenda.

## 8. Levar para o celular (opcional)

O gateway de mensageria permite conversar com o mesmo Hermes pelo Telegram, Discord, Slack, WhatsApp, Signal, e-mail e outras plataformas. Faça isso só depois que o uso no terminal estiver estável:

```bash
hermes gateway setup     # configuração interativa das plataformas
hermes gateway install   # instala como serviço (systemd no Linux, launchd no macOS)
hermes gateway start
hermes gateway status
```

No WSL, a documentação recomenda `hermes gateway run` em primeiro plano, dentro de um `tmux`, porque o suporte a systemd ali é instável. O ponto de segurança mais importante desta etapa é a lista de usuários autorizados: um bot com acesso ao terminal deve responder apenas a você. Configure variáveis como `TELEGRAM_ALLOWED_USERS` no `~/.hermes/.env` e evite `GATEWAY_ALLOW_ALL_USERS=true`. O passo a passo de cada plataforma está na página do [gateway de mensageria](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/).

## 9. Rotinas com cron (opcional)

O Hermes tem um agendador próprio. Você pode criar tarefas pedindo em linguagem natural, como no prompt 8, pelo comando `/cron` dentro da conversa ou pela CLI:

```bash
hermes cron create "weekdays at 8am" "Gere o relatório de alterações da base de contexto" --name "relatorio-base"
hermes cron list
hermes cron status
```

Os agendamentos aceitam formatos como `every 2h`, `every day at 9am`, `weekdays at 8am` e expressões cron como `0 9 * * 1-5`. As saídas ficam salvas em `~/.hermes/cron/output/`, e o `hermes cron status` informa se o agendador está ativo (ele roda junto com o processo do gateway). Duas recomendações para começar: deixe a primeira rotina gravando apenas um arquivo local, sem envio de mensagens, e lembre que cada execução chama o modelo e gera custo. Por padrão, quando uma tarefa agendada esbarra em um comando perigoso, ele é bloqueado (`approvals.cron_mode: deny`), e vale manter assim. Os detalhes estão na página de [tarefas agendadas](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron).

## 10. Segurança, custos e próximos passos

Um agente com acesso ao terminal executa comandos que alteram arquivos e configurações da sua máquina. Por isso, a segurança começa na configuração e continua na revisão que você faz do trabalho dele.

- **Aprovações de comandos.** O Hermes compara cada comando com uma lista de padrões perigosos. No modo padrão (`smart`), um modelo auxiliar avalia o risco, aprova sozinho comandos de baixo risco, nega os claramente perigosos e pede a sua confirmação nos casos duvidosos. O modo `manual` pede confirmação sempre que um comando perigoso aparece. Evite o modo `off` e o `/yolo`, que desligam essas verificações; a documentação recomenda usá-los apenas em ambientes descartáveis e confiáveis.
- **Permissões mínimas.** Ative só os toolsets e os servidores MCP que a tarefa exige, filtre as ferramentas MCP com `include`/`exclude` e, ao conectar apps no Composio, autorize apenas as contas e os escopos necessários. Para isolar a execução, a documentação mostra como usar um backend Docker (`hermes config set terminal.backend docker`); nesse caso, as verificações de comandos perigosos são puladas porque o contêiner passa a ser a fronteira de segurança.
- **Segredos fora do chat.** Nunca cole senhas, tokens ou códigos de verificação na conversa nem na base de contexto. Chaves de provedores entram pelo `hermes model` ou ficam no `~/.hermes/.env`; senhas de serviços ficam no seu gerenciador de senhas.
- **Revise o que o agente executa.** Leia os comandos antes de aprovar, peça o diff antes de qualquer commit e confira os arquivos de memória e as skills que ele cria.
- **Custos.** Cada mensagem consome tokens do provedor escolhido, e a memória, o contexto carregado e as ferramentas ativas entram em todas as requisições. Rotinas agendadas e integrações também geram custo a cada execução. Acompanhe o painel de uso do seu provedor e, se estiver usando o Composio, os limites do seu plano.
- **Comece pequeno.** Prefira tarefas curtas e conferíveis, como as dos prompts da seção 4, e aumente a autonomia conforme o agente se mostra confiável no seu contexto.

A página de [segurança](https://hermes-agent.nousresearch.com/docs/user-guide/security) cobre aprovações, autorização no gateway e isolamento em contêiner. Para continuar estudando, a [trilha de aprendizado](https://hermes-agent.nousresearch.com/docs/getting-started/learning-path) da documentação indica o que ler em cada nível, e o [workflow de IA assistida](./workflow-ia-assistida.md) deste repositório mostra como a palestra organiza o trabalho com agentes.

## Checklist final

- [ ] `hermes doctor` sem problemas pendentes.
- [ ] Provedor e modelo configurados com `hermes model`, com modelo de pelo menos 64 mil tokens de contexto.
- [ ] Uma conversa de várias rodadas funcionando e `hermes --continue` retomando a sessão.
- [ ] Preferências curtas salvas na memória e conferidas.
- [ ] Projeto local inspecionado sem alterações.
- [ ] Base de contexto criada, com `README.md` como índice, `AGENTS.md` revisado e repositório Git privado.
- [ ] Primeira skill criada a partir de um procedimento testado e listada em `hermes skills list`.
- [ ] Toolsets revisados com `hermes tools`.
- [ ] Composio conectado por CLI ou MCP, com leitura da agenda conferida e nenhuma ação de escrita sem confirmação.
- [ ] (Opcional) Gateway com lista de usuários autorizados.
- [ ] (Opcional) Uma rotina agendada gravando relatório local e aparecendo em `hermes cron list`.
- [ ] Nenhum segredo no chat, na base de contexto ou no `config.yaml`.

## Links de referência

**Materiais deste repositório**

- [README do repositório](../README.md)
- [Guia da palestra](./guia-da-palestra.md)
- [Arquitetura e operação](./arquitetura-operacao.md)
- [Workflow de IA assistida](./workflow-ia-assistida.md)
- [Fontes](./fontes.md)

**Hermes Agent: primeiros passos**

- [Documentação oficial](https://hermes-agent.nousresearch.com/docs/)
- [Repositório no GitHub](https://github.com/NousResearch/hermes-agent)
- [Instalação](https://hermes-agent.nousresearch.com/docs/getting-started/installation)
- [Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)
- [Trilha de aprendizado](https://hermes-agent.nousresearch.com/docs/getting-started/learning-path)
- [Configuração](https://hermes-agent.nousresearch.com/docs/user-guide/configuration)
- [Provedores de modelo](https://hermes-agent.nousresearch.com/docs/integrations/providers)
- [Nous Portal](https://hermes-agent.nousresearch.com/docs/integrations/nous-portal)

**Hermes Agent: recursos**

- [Memória persistente](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)
- [Skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)
- [Context files (AGENTS.md, SOUL.md e outros)](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)
- [Personalidade e SOUL.md](https://hermes-agent.nousresearch.com/docs/user-guide/features/personality)
- [Ferramentas e toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools)
- [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
- [Use MCP with Hermes](https://hermes-agent.nousresearch.com/docs/guides/use-mcp-with-hermes)
- [Referência de configuração MCP](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference)
- [Gateway de mensageria](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/)
- [Tarefas agendadas (cron)](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron)
- [Segurança](https://hermes-agent.nousresearch.com/docs/user-guide/security)
- [Dicas e boas práticas](https://hermes-agent.nousresearch.com/docs/guides/tips)

**Hermes Agent: referência**

- [Comandos da CLI](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)
- [Comandos de barra](https://hermes-agent.nousresearch.com/docs/reference/slash-commands)
- [FAQ e solução de problemas](https://hermes-agent.nousresearch.com/docs/reference/faq)

**Composio**

- [Site do Composio](https://composio.dev)
- [Dashboard](https://dashboard.composio.dev)
- [Guia oficial: Composio com Hermes](https://composio.dev/toolkits/composio/framework/hermes-agent)
- [Composio CLI](https://docs.composio.dev/docs/cli)
- [Composio Connect (MCP)](https://docs.composio.dev/docs/composio-connect)
- [Plugin do Composio para Claude Code](https://docs.composio.dev/docs/claude-code-plugin)
- [Documentação do Composio](https://docs.composio.dev)

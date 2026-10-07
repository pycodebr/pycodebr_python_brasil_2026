# Fontes públicas e roteiro de leitura

Esta bibliografia reúne documentação primária para aprofundar a palestra de Felipe Azambuja, da PycodeBR, na Python Brasil 2026. As referências descrevem mecanismos e capacidades; o estado de uma instalação precisa ser conferido no ambiente correspondente.

Volte ao [guia da palestra](guia-da-palestra.md), à [arquitetura da operação](arquitetura-operacao.md), ao [workflow de IA assistida](workflow-ia-assistida.md) ou à [observabilidade e manutenção](observabilidade-e-manutencao.md).

## Como usar as referências

Os números junto das afirmações nos guias apontam para os mesmos documentos listados abaixo. Comece pelo problema que você quer investigar e consulte a seção indicada, em vez de montar uma stack apenas pela lista de ferramentas.

1. Para entender reaproveitamento de contexto, leia memória e skills do Hermes e separe esses recursos da base de documentos consultáveis.
2. Para conectar um sistema ao agente, leia o guia MCP do Hermes e a especificação de tools.
3. Para acompanhar a aplicação, leia Prometheus, instrumentação Django e exportadores.
4. Para centralizar logs, confira o histórico do Promtail e a migração para Alloy.
5. Para iniciar uma investigação, escolha a rota de alerta e confira o payload do webhook.
6. Para integrar a correção, leia proteção de branch e regras de deploy no GitHub.

## Origem didática e desenhos autorais

Para os marcos de 2022 a 2026, consulte a [linha do tempo e suas fontes primárias](linha-do-tempo.md).

O workflow adapta os cinco passos ensinados por Felipe na Imersão IA Builders. A arquitetura da operação adapta os componentes ensinados na Imersão Agentes Autônomos, separando interfaces, runtime, modelos, contexto, ferramentas e entregas. Os encontros Elite #03 e #04 usam o SCSI para explicar deploy, monitoramento e operação por dois MCPs. Essa atribuição registra a origem didática, sem publicar materiais exclusivos ou links de acesso fechado.

O encontro #04 apresenta webhook acionando agente como próximo passo. O blueprint de manutenção do MentorIA, com report, branch, testes, PR, mensagem privada a Felipe, aprovação e deploy, é uma proposta ilustrativa desenvolvida para esta palestra. A arquitetura do SCSI não comprova a implantação do MentorIA.

Os templates destes materiais foram escritos para o guia público e usam exemplos fictícios. Você pode começar pelo [template de contexto](guia-da-palestra.md#template-de-contexto-reaproveitável), pelo [template de demanda](workflow-ia-assistida.md#template-de-demanda) e pelo [template de revisão](workflow-ia-assistida.md#template-de-revisão-da-sprint).

## Versões, histórico e configuração

- Promtail aparece na referência histórica de #04; Alloy é a atualização recomendada para uma implementação nova.
- A especificação MCP citada é a edição de 2025-06-18, para manter a referência explícita dos mecanismos descritos.
- As páginas do Traefik são da documentação v3.5; isso não indica a versão implantada em nenhum sistema apresentado.
- URLs com `latest` podem mudar. Confira a documentação compatível com a versão escolhida antes de copiar configurações.
- Catálogos MCP variam por versão, flags e permissões. Descubra as tools disponíveis no ambiente de estudo.
- Recursos e gates do GitHub dependem da configuração, da visibilidade do repositório e do plano da conta.

## O que estudar em cada grupo

**Agente e contexto:** veja quando a memória entra na sessão e como carregar procedimentos sob demanda. Compare o contexto mantido com o que precisa ser consultado de novo em cada tarefa.

**Ferramentas e domínio:** confira descoberta, schema, chamada, tratamento de erro e autorização. Uma integração deve restringir operações e dados ao escopo necessário.

**Telemetria:** identifique quem produz, coleta e armazena cada dado. Para métricas, observe scrape e nomes disponíveis; para logs, confira labels, retenção e conversão do coletor.

**Disparadores:** separe avaliação da regra, notificação e execução do agente. Valide autenticação, duplicidade e janela temporal no receiver.

**Deploy:** acompanhe a imagem versionada, o estado dos serviços, segredos e persistência. Confira atualização e recuperação antes de publicar uma mudança.

**Revisão e release:** compare os mecanismos de aprovação de PR com os gates de ambiente. Uma aprovação precisa se referir à versão que será integrada.

## Referências

### OpenClaw e Hermes: origem, nomes e lançamento

Leia o anúncio do OpenClaw e a história mantida pelo projeto para distinguir origem em 2025, popularização em janeiro de 2026 e renomeações Clawdbot → Moltbot → OpenClaw. Consulte o catálogo da Nous para a data de lançamento do Hermes Agent, 25/02/2026. Os números da linha do tempo são locais àquele guia, separados da numeração técnica abaixo.

- [Introducing OpenClaw](https://openclaw.ai/blog/introducing-openclaw).
- [OpenClaw lore](https://docs.openclaw.ai/start/lore).
- [Releases da Nous Research](https://nousresearch.com/releases).
- [Repositório oficial do Hermes Agent](https://github.com/NousResearch/hermes-agent).

OpenClaw e Hermes são projetos independentes. A sequência apresentada acompanha seus marcos públicos, sem comparar desempenho nem tratar as renomeações como três lançamentos de ferramentas distintas.

### Hermes Agent: contexto e integração

Seções de leitura: memória persistente, carregamento progressivo de skills e filtragem de tools MCP. A base versionada descrita no guia é uma organização de documentos da operação, separada desses mecanismos.

[20] https://hermes-agent.nousresearch.com/docs/user-guide/features/skills | Skills System | Hermes Agent\
[21] https://hermes-agent.nousresearch.com/docs/user-guide/features/memory | Persistent Memory | Hermes Agent\
[22] https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp | MCP | Hermes Agent\
[23] https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation | Delegation | Hermes Agent\
[24] https://hermes-agent.nousresearch.com/docs/user-guide/desktop | Hermes Desktop\
[25] https://hermes-agent.nousresearch.com/docs/user-guide/messaging/ | Messaging | Hermes Agent

### MCP e operações de domínio

Seções de leitura: listing/calling tools, autorização no Django MCP Server e modo somente leitura do Grafana MCP.

[1] https://github.com/grafana/mcp-grafana | Grafana MCP server\
[5] https://pypi.org/project/django-mcp-server | Django MCP Server\
[10] https://modelcontextprotocol.io/specification/2025-06-18/server/tools | Tools | Model Context Protocol

### Métricas e exportadores

Seções de leitura: arquitetura Prometheus, Quickstart/namespace no Django e requisitos para medir containers e host.

[3] https://prometheus.io/docs/introduction/overview | Overview | Prometheus\
[6] https://github.com/django-commons/django-prometheus | django-prometheus\
[12] https://github.com/google/cadvisor | cAdvisor\
[13] https://github.com/prometheus/node_exporter | Node exporter

### Logs: fonte histórica e migração

Seções de leitura: aviso de fim de vida do Promtail, migração para Alloy, conversão e limitações.

[2] https://grafana.com/docs/loki/latest/send-data/promtail | Promtail agent\
[9] https://grafana.com/docs/loki/latest/setup/migrate/migrate-to-alloy | Migrate to Alloy | Grafana Loki\
[11] https://grafana.com/docs/alloy/latest/set-up/migrate/from-promtail | Migrate from Promtail to Grafana Alloy

### Alertas e início de investigações

Seções de leitura: contact point webhook, assinatura HMAC, payload, agrupamento e roteamento de alertas.

[4] https://grafana.com/docs/grafana/latest/alerting/configure-notifications/manage-contact-points/integrations/webhook-notifier | Configure webhook notifications | Grafana\
[14] https://prometheus.io/docs/alerting/latest/alertmanager | Alertmanager | Prometheus

Para adaptar o acionamento do agente, confira também agendamentos, rotas autenticadas e o tratamento de payloads externos. A existência desses recursos não comprova que um alerta Grafana já acione o Hermes na operação apresentada.

[26] https://hermes-agent.nousresearch.com/docs/user-guide/features/cron | Scheduled Tasks | Hermes Agent\
[27] https://hermes-agent.nousresearch.com/docs/user-guide/messaging/webhooks | Webhooks | Hermes Agent

### Deploy, roteamento e segredos

Seções de leitura: serviços/tasks, atualização de imagem, Docker Secrets, ACME DNS challenge e provider Swarm.

[7] https://docs.docker.com/engine/swarm/how-swarm-mode-works/services | How services work | Docker\
[15] https://docs.docker.com/engine/swarm/services | Deploy services to a swarm | Docker\
[16] https://docs.docker.com/engine/swarm/secrets | Manage sensitive data with Docker secrets\
[18] https://doc.traefik.io/traefik/v3.5/reference/install-configuration/tls/certificate-resolvers/acme | ACME | Traefik v3.5\
[19] https://doc.traefik.io/traefik/v3.5/reference/install-configuration/providers/swarm | Traefik & Docker Swarm | Traefik v3.5

### PR, aprovação e release

Seções de leitura: reviews obrigatórios, status checks, bypass, required reviewers e segredos de ambiente.

[8] https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | About protected branches | GitHub\
[17] https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments | Deployments and environments | GitHub

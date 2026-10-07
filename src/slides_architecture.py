"""Public, sanitized architecture scenes and reference maintenance flows."""
from scene_helpers import (
    DOCS,
    REPOSITORY,
    head,
    icon,
    image,
    network,
    network_node,
    slide,
)

ARCHITECTURE_FOCUS = {
    'access': 'Você conversa com o mesmo núcleo operacional por interfaces e canais autorizados. SSH, VPN e mensageria têm funções diferentes.',
    'context': 'A memória guarda fatos selecionados; a base conserva documentos; as skills registram procedimentos. Projetos e estado operacional ficam separados.',
    'integrations': 'O Hermes usa modelos e consulta serviços por APIs, MCPs ou Composio. Cada conexão precisa de autenticação e permissões próprias.',
    'outputs': 'A execução produz arquivos, código e entregas para a Central de Operações. A publicação usa HTTPS e acesso conforme o tipo de material.',
}

OPERATION_SLIDE = slide(
    9, 'arquitetura-operacao', 'Infraestrutura de IA da PycodeBR',
    'Arquitetura da operação', 'lime',
    head('Infraestrutura de IA da PycodeBR')
    + '<div class="scene operation-scene"><div class="architecture-controls" role="group" aria-label="Explorar a arquitetura">'
    + ''.join(f'<button data-architecture-focus="{key}" aria-pressed="false">{label}</button>' for key, label in [('access', 'Acessos'), ('context', 'Contexto'), ('integrations', 'Integrações'), ('outputs', 'Entregas')])
    + '</div>'
    + network(
        '<div class="access-column"><h3 class="layer-label">Usuário e equipe</h3>'
        + network_node('ssh', 'Terminal / SSH', 'CLI e acesso técnico', cls='arch-node access-node')
        + network_node('desktop', 'Interfaces desktop', 'Hermes Desktop<br>Orca Desktop', cls='arch-node access-node')
        + network_node('mobile', 'Acesso móvel', 'Orca Mobile<br>Tailscale VPN', cls='arch-node access-node')
        + network_node('chat', 'Mensageria', 'Slack e WhatsApp<br>Telegram como opção', cls='arch-node access-node')
        + '</div><div class="vps-boundary"><span class="boundary-label">VPS · ambiente de execução</span><div class="vps-top">'
        + network_node('gateway', 'Gateway e rotinas', 'Pedidos, agendas e eventos', cls='arch-node access-node')
        + '</div><div class="vps-main">'
        + network_node('context', 'Base de contexto', 'Documentos<br>Memória e skills', cls='arch-node context-node')
        + '<div class="network-node operation-core" data-node-id="hermes">'
        + image('hermes-logo-dark.png', 'Hermes Agent', '')
        + '<h3>Hermes Agent</h3><p>Observar · executar · verificar</p></div>'
        + network_node('projects', 'Projetos e GitHub', 'Código e arquivos<br>Harnesses CLIs opcionais', cls='arch-node context-node')
        + '</div><div class="vps-bottom">'
        + network_node('execution', 'Ferramentas de execução', 'Terminal, browser e código', cls='arch-node output-node')
        + network_node('state', 'Estado e dados', 'Sessões e bancos operacionais', cls='arch-node context-node')
        + '</div></div><div class="external-column">'
        + network_node('models', 'Modelos', 'OpenAI e outros provedores<br>OpenCode Go/Zen como opção', cls='arch-node integration-node')
        + network_node('integration', 'MCPs · APIs · Composio', 'Notion, ClickUp, Google Workspace<br>Serviços e contas autorizadas', cls='arch-node integration-node')
        + network_node('central', 'Central de Operações', 'Dashboards, relatórios e materiais<br>HTTPS · Cloudflare DNS', cls='arch-node output-node')
        + '</div>',
        [['ssh', 'hermes', '#7dd3fc', 'access'], ['desktop', 'hermes', '#7dd3fc', 'access'],
         ['mobile', 'execution', '#7dd3fc', 'access'], ['chat', 'gateway', '#7dd3fc', 'access'],
         ['gateway', 'hermes', '#7dd3fc', 'access'], ['context', 'hermes', '#b9a2f8', 'context'],
         ['hermes', 'projects', '#b9a2f8', 'context'], ['hermes', 'state', '#b9a2f8', 'context'],
         ['hermes', 'models', '#c95fb4', 'integrations', 'above'], ['hermes', 'integration', '#ffd343', 'integrations', 'above'],
         ['hermes', 'execution', '#b7ff06', 'outputs'], ['execution', 'central', '#b7ff06', 'outputs', 'below']],
        'operation-grid',
    )
    + '<p class="architecture-explanation" data-architecture-explanation aria-live="polite"></p>'
    + '<p class="caption">Essa base pode ser replicada e adaptada a outras operações, conforme sistemas, recursos e permissões.</p></div>',
    'Arquitetura conceitual da operação PycodeBR ensinada na Imersão Agentes Autônomos. Separa interfaces, VPS, contexto, projetos, execução, modelos, integração e entregas. Recursos opcionais não são apresentados como conexões ativas; a aplicação em outra empresa exige adaptação.',
    [DOCS + 'user-guide/features/mcp', DOCS + 'user-guide/messaging/', DOCS + 'user-guide/desktop'],
    'architecture-operation', scene='architecture',
)

MONITORING_SLIDE = slide(
    14, 'monitoria', 'Arquitetura de monitoria com Hermes e MCPs',
    'Monitoria com IA · dois MCPs', 'orange',
    head('Arquitetura de monitoria com Hermes e MCPs')
    + '<div class="scene monitoring-scene">'
    + network(
        '<div class="application-boundary"><span class="boundary-label">Aplicação e observabilidade</span>'
        + '<div class="signals panel" data-node-id="grafana"><div class="signal-title"><span data-signal-title></span>'
        + image('grafana-icon.svg', 'Grafana')
        + '</div><div class="signal-tabs"><button data-signal="latency" aria-pressed="true">Latência</button><button data-signal="queue" aria-pressed="false">Fila</button><button data-signal="errors" aria-pressed="false">Erros</button></div>'
        + '<svg class="signal-chart" viewBox="0 0 480 205" aria-label="Telemetria ilustrativa"><path class="grid" d="M0 40h480M0 100h480M0 160h480M0 203h480"/><path class="threshold" d="M0 70h480"/><path class="plot" d="M5 180L475 20"/></svg>'
        + '<p class="signal-legend" data-signal-legend></p><div class="log-lines" data-log-line></div><p class="telemetry-origin">Prometheus · métricas<br>Loki · logs → Grafana</p></div>'
        + network_node('domain', 'MCP do sistema', 'MentorIA como exemplo:<br>estado e dados do domínio', cls='compact-node')
        + '</div><div class="observer-boundary"><span class="boundary-label">VPS · infraestrutura do Hermes</span>'
        + network_node('trigger', 'Webhook ou rotina', 'Entrada filtrada e deduplicada', cls='compact-node')
        + '<div class="observer-main"><div class="mcp-bridge">'
        + network_node('grafana-mcp', 'MCP do Grafana', 'Consultar métricas e logs', 'mcp-icon-white.svg', 'compact-node')
        + '</div><div class="network-node observer-core" data-node-id="observer">'
        + image('hermes-logo-dark.png', 'Hermes Agent', '')
        + '<h3>Hermes</h3><p>Contexto, skills e histórico</p><div class="runtime-parts"><span>Fila de trabalho</span><span>Worker / ferramentas</span></div></div></div>'
        + '<p class="runtime-note">Consultas com escopo e ações sob regras.</p></div><div class="diagnosis-column">'
        + '<div class="network-node diagnosis-result" data-node-id="diagnosis"><h3>Investigar</h3><p data-investigation></p></div>'
        + '<div class="network-node diagnosis-result" data-node-id="action"><h3>Preparar a ação</h3><p data-action></p></div>'
        + '<div class="network-node diagnosis-result" data-node-id="notify"><h3>Avisar e conferir</h3><p>Diagnóstico e evidências<br>em canal autorizado.</p><div class="channel-icons">'
        + image('whatsapp-simpleicons.svg', 'WhatsApp', 'logo pad') + icon('message') + '</div></div></div>',
        [['grafana', 'grafana-mcp', '#ffb56b'], ['grafana-mcp', 'observer', '#ffb56b'],
         ['domain', 'observer', '#7dd3fc'], ['trigger', 'observer', '#b9a2f8'],
         ['observer', 'diagnosis', '#ffd343'], ['diagnosis', 'action', '#ffd343'], ['action', 'notify', '#b7ff06']],
        'monitoring-architecture',
    )
    + '<p class="interactive-note">Arquitetura de referência. O alerta inicia a análise; o MCP fornece consultas. Gráficos ilustrativos, sem dados de produção.</p></div>',
    'Arquitetura de referência que separa aplicação/telemetria da VPS do Hermes, os dois MCPs, evento ou agendamento, fila, contexto, worker, diagnóstico e comunicação. A evolução apresentada não é uma automação de manutenção ativada em produção.',
    ['https://github.com/grafana/mcp-grafana', 'https://grafana.com/docs/grafana/latest/alerting/configure-notifications/manage-contact-points/integrations/webhook-notifier/', REPOSITORY + '/blob/main/materiais/observabilidade-e-manutencao.md'],
    'architecture-monitoring', scene='monitoring',
)

REPORTS_SLIDE = slide(
    15, 'reports', 'Reports de usuários e propostas de correção',
    'MentorIA · eventos, código e PRs', 'rose',
    head('Reports de usuários e propostas de correção')
    + '<div class="scene reports-scene">'
    + network(
        '<div class="report-source"><span class="boundary-label">Sistema · MentorIA como exemplo</span><div class="report-card panel" data-node-id="user-report">'
        + '<span class="section-tag">REPORT DO USUÁRIO</span><div class="report-kind"><button data-report="bug" aria-pressed="true">Bug</button><button data-report="feature" aria-pressed="false">Melhoria</button></div>'
        + '<h3 data-report-title></h3><p data-report-description></p><div class="small" data-report-triage></div></div></div>'
        + '<div class="maintenance-boundary"><span class="boundary-label">VPS · Hermes e projeto em revisão</span><div class="maintenance-entry">'
        + network_node('report-entry', 'Evento + MCP do sistema', 'Receber o sinal, consultar o report<br>e verificar contexto e duplicidade', 'mcp-icon-white.svg', 'compact-node')
        + '<div class="network-node maintenance-agent" data-node-id="maintainer">'
        + image('hermes-logo-dark.png', 'Hermes Agent', '')
        + '<div><h3>Hermes</h3><p>Fila · contexto · skills<br>Classificação e critérios de aceite</p></div></div></div>'
        + '<div class="repository-lanes">'
        + network_node('branch', 'Branch / worktree', 'Reproduzir o bug ou<br>delimitar a melhoria', cls='compact-node')
        + network_node('tests', 'Código e testes', 'Implementar, revisar e corrigir<br>sem alterar produção', cls='compact-node')
        + network_node('pull-request', 'Pull Request', 'Diff, testes e riscos<br>para a revisão de Felipe', 'GitHub_Invertocat_White_Clearspace.svg', 'compact-node')
        + '</div><div class="maintenance-gate">' + icon('shield')
        + '<span>A aprovação da PR permite continuar com merge, deploy e verificação.</span></div></div>',
        [['user-report', 'report-entry', '#c95fb4'], ['report-entry', 'maintainer', '#7dd3fc'],
         ['maintainer', 'branch', '#b9a2f8'], ['branch', 'tests', '#ffd343'], ['tests', 'pull-request', '#b7ff06']],
        'reports-architecture',
    )
    + '<p class="interactive-note">Arquitetura de referência proposta. Eventos e consultas são mecanismos separados; esta simulação não cria PRs nem altera serviços.</p></div>',
    'Arquitetura de referência proposta para MentorIA: reports de bugs e melhorias chegam por evento ou coleta, são consultados pelo MCP do sistema, classificados e tratados pelo Hermes com contexto, branch, implementação, testes e PR. Merge e deploy continuam sujeitos à aprovação humana.',
    ['https://pypi.org/project/django-mcp-server/', REPOSITORY + '/blob/main/materiais/observabilidade-e-manutencao.md'],
    'architecture-reports', scene='reports',
)

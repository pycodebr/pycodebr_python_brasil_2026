"""One visual scene for each year in the talk's chronology."""
from scene_helpers import head, icon, image, network, network_node, slide

HISTORY = [
    slide(
        5, 'ano-2022', '2022: ChatGPT e aplicações com modelos de linguagem',
        '2022 · conversa e aplicações', 'cyan',
        head('2022: ChatGPT e aplicações<br class="desktop-break"> com modelos de linguagem')
        + '<div class="scene year-scene year-2022"><div class="year-path"><span>2022</span><i></i><span>2023</span><i></i><span>2024</span><i></i><span>2025</span><i></i><span>2026</span></div>'
        + '<div class="year-two"><div class="conversation-object enter"><div class="year-brand">'
        + image('openai-lobe.svg', 'OpenAI', 'logo pad')
        + '<div><h3>ChatGPT</h3><span>30 de novembro</span></div></div><div class="chat-paper"><p class="chat-prompt">Explique este código em Python.</p><p class="chat-response">Uma conversa com o modelo, ajustada a cada pergunta.</p></div><p class="year-caption">A interface de conversa chega ao cotidiano.</p></div>'
        + '<div class="application-object enter"><div class="year-brand">'
        + image('langchain-logo-dark.svg', 'LangChain', 'logo brand-wordmark')
        + '<div><h3>LangChain</h3><span>Primeiro pacote Python: 24 de outubro</span></div></div>'
        + network(network_node('request', 'Aplicação', 'Seu código e suas regras')
                  + network_node('model', 'Modelo', 'Uma chamada por API')
                  + network_node('data', 'Dados', 'Documentos e ferramentas'),
                  [['request', 'model', '#7dd3fc'], ['model', 'data', '#ffd343']], 'year-chain')
        + '<p class="year-caption">O desenvolvedor conecta o modelo à aplicação.</p></div></div>'
        + '<p class="caption">Marcos de acesso e composição, não o início da pesquisa em inteligência artificial.</p></div>',
        'Em outubro, LangChain oferece composição de aplicações. Em novembro, ChatGPT populariza a interface conversacional. Modelo, produto e código de integração são camadas diferentes.',
        ['https://openai.com/index/chatgpt/', 'https://www.langchain.com/blog/announcing-our-10m-seed-round-led-by-benchmark'],
        'chronology'),
    slide(
        5, 'ano-2023', '2023: frameworks, fluxos visuais e agentes',
        '2023 · composição e execução', 'yellow',
        head('2023: frameworks, fluxos<br class="desktop-break"> visuais e agentes')
        + '<div class="scene year-scene year-2023"><div class="year-path"><span>2022</span><i></i><span>2023</span><i></i><span>2024</span><i></i><span>2025</span><i></i><span>2026</span></div>'
        + '<div class="workflow-vs-agent"><div class="visual-workflow enter"><h3>Construir um fluxo</h3><div class="flow-brands">'
        + image('langchain-logo-dark.svg', 'LangChain', 'logo brand-wordmark')
        + image('langflow-icon.svg', 'Langflow') + image('n8n-icon.svg', 'n8n')
        + '</div><div class="flow-steps"><div>' + icon('file') + '<span>Entrada</span></div><i class="step-arrow"></i><div>'
        + icon('brain') + '<span>Modelo</span></div><i class="step-arrow"></i><div>'
        + icon('check') + '<span>Saída</span></div></div><p>LangChain e Langflow ajudam a compor aplicações. O n8n integra LangChain em outubro.</p></div>'
        + '<div class="agent-loop-object enter"><h3>Experimentar agentes</h3><div class="loop-diagram"><svg viewBox="0 0 440 250" aria-hidden="true"><path class="loop-trace" d="M70 125C70 10 370 10 370 125C370 240 70 240 70 125"/></svg><span class="loop-label loop-top">Objetivo</span><span class="loop-label loop-left">Observar</span><span class="loop-label loop-right">Executar</span><div class="loop-core">AutoGPT</div><span class="loop-label loop-bottom">Escolher a próxima ação</span></div><p>O modelo participa da escolha das ações e recebe os resultados das ferramentas.</p></div></div>'
        + '<p class="caption">Workflows e agentes podem coexistir. O n8n já existia desde 2019.</p></div>',
        'Frameworks, construtores visuais e experiências como AutoGPT ampliam a discussão sobre ferramentas e ciclos. A sequência determinística de um workflow difere da escolha de ações por um agente.',
        ['https://github.com/Significant-Gravitas/AutoGPT/releases/tag/v0.1.0', 'https://blog.n8n.io/n8ns-october-highlights-new-features-refined-cloud-plans-and-workflow-editor-improvements'],
        'chronology'),
    slide(
        5, 'ano-2024', '2024: estado, ciclos e integrações com MCP',
        '2024 · estado e integrações', 'lime',
        head('2024: estado, ciclos<br class="desktop-break"> e integrações com MCP')
        + '<div class="scene year-scene year-2024"><div class="year-path"><span>2022</span><i></i><span>2023</span><i></i><span>2024</span><i></i><span>2025</span><i></i><span>2026</span></div>'
        + '<div class="protocol-story"><div class="state-object enter"><div class="year-brand">'
        + image('langgraph-icon-blue.svg', 'LangGraph')
        + '<div><h3>LangGraph</h3><span>Janeiro</span></div></div><div class="state-machine"><span>Estado</span><i class="step-arrow"></i><span>Decisão</span><div class="return-path">'
        + icon('loop') + '<span>Continuar, repetir ou encerrar</span></div></div><p>O fluxo guarda o que já aconteceu.</p></div>'
        + '<div class="visual-builder enter"><div class="year-brand">' + image('langflow-icon.svg', 'Langflow')
        + '<div><h3>Langflow 1.0</h3><span>24 de junho</span></div></div><div class="builder-nodes"><span>Entrada</span><span>Modelo</span><span>Ferramenta</span></div><p>A composição da aplicação também pode ser visual.</p></div>'
        + '<div class="protocol-object enter"><div class="year-brand">' + image('mcp-logo-dark.svg', 'Model Context Protocol')
        + '<div><h3>MCP</h3><span>25 de novembro</span></div></div><div class="protocol-plug">'
        + icon('link') + '<span>Aplicação de IA<br>↔ servidor de ferramentas</span></div><p>Um protocolo para conectar ferramentas e dados.</p></div></div>'
        + '<p class="caption">Model Context Protocol padroniza a integração; as permissões continuam na implementação.</p></div>',
        'LangGraph organiza estado e ciclos; Langflow 1.0 marca uma versão da composição visual; MCP padroniza a conexão entre aplicação de IA e servidores de ferramentas.',
        ['https://www.langchain.com/blog/langchain-v0-1-0', 'https://www.langflow.org/blog/langflow-1-0-is-out-with-a-cloud-service', 'https://www.anthropic.com/news/model-context-protocol'],
        'chronology'),
    slide(
        5, 'ano-2025', '2025: a IA passa a trabalhar no projeto',
        '2025 · CLIs e skills', 'purple',
        head('2025: a IA passa a trabalhar no projeto')
        + '<div class="scene year-scene year-2025"><div class="year-path"><span>2022</span><i></i><span>2023</span><i></i><span>2024</span><i></i><span>2025</span><i></i><span>2026</span></div>'
        + '<div class="project-era"><div class="project-terminal enter"><div class="terminal-bar"><i></i><i></i><i></i></div><div class="project-files"><span>projeto/</span><span>├ src/</span><span>├ testes/</span><span>└ SKILL.md</span></div><div class="terminal-task"><span>&gt; Corrija o bug e confira os testes.</span><p>Ler arquivos → alterar código → testar → revisar o diff</p></div><span class="terminal-caption">Representação didática de um projeto.</span></div>'
        + '<div class="cli-milestones"><div class="cli-release enter">' + image('claude-code-lobe-color.svg', 'Claude Code')
        + '<div><h3>Claude Code</h3><p>Preview em fevereiro.<br>Disponibilidade geral em maio.</p></div></div><div class="cli-release enter">'
        + image('openai-lobe.svg', 'OpenAI Codex CLI', 'logo pad')
        + '<div><h3>Codex CLI</h3><p>Apresentado em abril.<br>Execução no terminal.</p></div></div><div class="skill-release enter">'
        + icon('folder') + '<div><h3>Agent Skills</h3><p>Procedimentos, scripts e referências<br>carregados conforme a tarefa.</p></div></div></div></div>'
        + '<p class="caption">A CLI é o aplicativo que conduz a execução. O modelo é uma escolha separada.</p></div>',
        'Claude Code e Codex CLI trabalham no ambiente do projeto. Agent Skills organizam procedimentos e recursos reutilizáveis sem alterar os pesos do modelo.',
        ['https://www.anthropic.com/news/claude-3-7-sonnet', 'https://www.anthropic.com/news/claude-4', 'https://openai.com/index/introducing-o3-and-o4-mini/', 'https://agentskills.io/specification'],
        'chronology'),
    slide(
        5, 'ano-2026', '2026: assistentes pessoais com memória e canais',
        '2026 · OpenClaw e Hermes Agent', 'rose',
        head('2026: assistentes pessoais<br class="desktop-break"> com memória e canais')
        + '<div class="scene year-scene year-2026"><div class="year-path"><span>2022</span><i></i><span>2023</span><i></i><span>2024</span><i></i><span>2025</span><i></i><span>2026</span></div>'
        + '<div class="personal-agent-era"><article class="personal-agent openclaw-era enter"><span class="month-tag">Janeiro · popularização e renomeações</span>'
        + '<div class="rename-chain"><span>Clawdbot</span><i class="step-arrow"></i><span>Moltbot</span><i class="step-arrow"></i><strong>OpenClaw</strong></div>'
        + image('openclaw-official.svg', 'Símbolo oficial do OpenClaw', 'era-mascot')
        + '<p>Um dos pioneiros desta onda de assistentes pessoais open source.</p><div class="era-capabilities"><span>Seu computador</span><span>Seus canais</span><span>Ferramentas autorizadas</span></div></article>'
        + '<article class="personal-agent hermes-era enter"><span class="month-tag">25 de fevereiro · Nous Research</span><h3>Hermes Agent</h3>'
        + image('hermes-logo-dark.png', 'Hermes Agent, projeto Nous Research', 'era-mascot')
        + '<p>Execução por ferramentas, memória persistida e criação de skills.</p><div class="era-capabilities"><span>Núcleo em Python</span><span>Continuidade</span><span>Auto skills</span></div></article></div>'
        + '<p class="caption">O projeto que se tornou OpenClaw começou em 2025. Hermes é um projeto independente, lançado depois.</p></div>',
        'Clawdbot, Moltbot e OpenClaw são nomes sucessivos do mesmo projeto, iniciado em 2025 e popularizado em janeiro de 2026. Hermes Agent, da Nous Research, foi lançado em 25 de fevereiro. O pioneirismo se refere à onda de assistentes pessoais open source, não à origem de todos os agentes autônomos.',
        ['https://openclaw.ai/blog/introducing-openclaw', 'https://docs.openclaw.ai/start/lore', 'https://nousresearch.com/releases'],
        'chronology'),
]

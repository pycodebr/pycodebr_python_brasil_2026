"""Reviewed interactive states; all examples run locally without external APIs."""
from slides_opening import SLIDES as OPENING
from slides_workflow import SLIDES as WORKFLOW

SLIDES = OPENING + WORKFLOW
INTERACTIONS = {
    'timeline': {
        '2022': {'title': 'A interface de conversa se populariza.', 'body': 'ChatGPT: 30 de novembro. LangChain já havia publicado seu primeiro pacote Python em 24 de outubro.', 'source': 'https://openai.com/index/chatgpt/', 'sourceLabel': 'ChatGPT e LangChain · fontes no guia', 'logos': [{'file': 'openai-lobe.svg', 'name': 'OpenAI', 'pad': True}, {'file': 'langchain-logo-dark.svg', 'name': 'LangChain'}]},
        '2023': {'title': 'Agentes e fluxos ganham ferramentas de construção.', 'body': 'Experimentos com AutoGPT, composição com LangChain/Langflow e integração LangChain no n8n. O n8n já existia desde 2019.', 'source': 'https://blog.n8n.io/n8ns-october-highlights-new-features-refined-cloud-plans-and-workflow-editor-improvements', 'sourceLabel': 'n8n · integração de IA em 2023', 'logos': [{'file': 'langchain-logo-dark.svg', 'name': 'LangChain'}, {'file': 'langflow-icon.svg', 'name': 'Langflow'}, {'file': 'n8n-icon.svg', 'name': 'n8n'}]},
        '2024': {'title': 'Estado, ciclos e integrações ganham forma.', 'body': 'LangGraph em janeiro, Langflow 1.0 em junho e MCP em novembro. Cada camada resolve uma parte da aplicação.', 'source': 'https://www.anthropic.com/news/model-context-protocol', 'sourceLabel': 'Anthropic · Model Context Protocol', 'logos': [{'file': 'langchain-logo-dark.svg', 'name': 'LangChain'}, {'file': 'langflow-icon.svg', 'name': 'Langflow'}, {'file': 'mcp-logo-dark.svg', 'name': 'MCP'}]},
        '2025': {'title': 'A IA entra no ambiente do projeto.', 'body': 'Claude Code: preview em fevereiro e disponibilidade geral em maio. Codex CLI chega em abril. Skills organizam procedimentos reutilizáveis.', 'source': 'https://www.anthropic.com/news/claude-3-7-sonnet', 'sourceLabel': 'Claude Code · preview e GA distintos', 'logos': [{'file': 'claude-code-lobe-color.svg', 'name': 'Claude Code'}, {'file': 'openai-lobe.svg', 'name': 'OpenAI', 'pad': True}, {'file': 'opencode-logo-dark.svg', 'name': 'OpenCode'}]},
        '2026': {'title': 'O trabalho continua entre sessões e canais.', 'body': 'Hermes Agent: 25 de fevereiro, pela Nous Research. Memória persistida, auto skills e execução por ferramentas no mesmo ambiente.', 'source': 'https://nousresearch.com/releases', 'sourceLabel': 'Nous Research · catálogo de releases', 'logos': [{'file': 'hermes-logo-dark.png', 'name': 'Hermes Agent'}, {'file': 'python-icon.svg', 'name': 'Python'}]},
    },
    'learning': {
        'first': 'A primeira tarefa exige investigar, corrigir e registrar o procedimento que funcionou.',
        'reuse': 'Na próxima tarefa, o Hermes recupera a skill e reaproveita a verificação. Você repete menos contexto.',
    },
    'workflow': [
        {'title': 'Prompt bruto → Prompt refinado', 'body': 'Organize objetivo, usuários, regras e restrições antes de implementar.', 'file': 'Prompt refinado', 'output': 'A demanda estruturada.'},
        {'title': 'Prompt refinado → PRD.md', 'body': 'Especifique o produto e organize o trabalho em sprints.', 'file': 'PRD.md', 'output': 'Requisitos e critérios de aceite.'},
        {'title': 'PRD.md → Start Template', 'body': 'Prepare o projeto, as dependências e o design system.', 'file': 'Start Template', 'output': 'Uma base pronta para a sprint.'},
        {'title': 'Start Template → Sprint', 'body': 'Implemente um recorte por vez no contexto do projeto.', 'file': 'Sprint implementada', 'output': 'Mudanças disponíveis para revisão.'},
        {'title': 'Sprint → Review, Correções e Commit', 'body': 'Revise, teste e corrija antes do commit e do push. Depois, avance à próxima sprint.', 'file': 'Commit validado', 'output': 'O ciclo retorna à próxima sprint.'},
    ],
    'monitoring': {
        'latency': {'title': 'Latência em alta', 'legend': 'Tempo de resposta · curva ilustrativa', 'log': 'request_duration: aumento\nserviço: aplicação de exemplo', 'investigation': 'Cruzar requisições, consultas e a janela de logs.', 'action': 'Preparar hipótese, teste e proposta de correção.', 'path': 'M5 178L50 173L95 179L140 150L185 144L230 117L275 105L320 80L365 62L410 47L475 20'},
        'queue': {'title': 'Fila acumulando', 'legend': 'Trabalho pendente · curva ilustrativa', 'log': 'queue_depth: aumento\nworker: cenário de exemplo', 'investigation': 'Conferir chegada de tarefas, workers e falhas.', 'action': 'Avaliar capacidade e o runbook autorizado.', 'path': 'M5 187L50 187L95 168L140 164L185 139L230 139L275 97L320 96L365 55L410 54L475 16'},
        'errors': {'title': 'Erros após uma mudança', 'legend': 'Ocorrências por janela · curva ilustrativa', 'log': 'http_errors: aumento\nversão: revisão de exemplo', 'investigation': 'Relacionar o comportamento à versão e reproduzir.', 'action': 'Propor patch ou recuperação sob a política do projeto.', 'path': 'M5 180L50 183L95 178L140 180L185 172L230 30L275 108L320 25L365 87L410 37L475 68'},
    },
    'reports': {
        'bug': {'title': 'A busca falha com filtros combinados.', 'description': 'Uma pessoa descreve o comportamento e o resultado esperado.', 'triage': 'Bug → conferir contexto e reproduzir.', 'pr': 'Corrigir a combinação de filtros', 'message': 'Preparei uma PR com a correção, os testes e os riscos. Você aprova esta revisão?'},
        'feature': {'title': 'Salvar um filtro para reutilizar depois.', 'description': 'Uma sugestão propõe reduzir uma tarefa repetida no sistema.', 'triage': 'Melhoria → avaliar relevância e critérios de aceite.', 'pr': 'Adicionar filtros salvos ao projeto', 'message': 'Preparei uma PR para a melhoria, com critérios e testes. Você aprova esta revisão?'},
    },
}

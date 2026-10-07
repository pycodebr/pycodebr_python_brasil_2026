"""Explain persistent knowledge through concrete files and reuse."""
from scene_helpers import DOCS, head, icon, slide

MEMORY_SLIDE = slide(
    8, 'memoria', 'Memória e auto skills no Hermes',
    'Memória, base de contexto e skills', 'purple',
    head('Memória e auto skills no Hermes')
    + '<div class="scene memory-teaching"><div class="knowledge-shelf">'
    + '<article class="knowledge-file enter" data-memory-kind="memory"><div class="file-tab">'
    + icon('brain') + '<span>MEMORY.md</span></div><h3>Fatos persistidos</h3>'
    + '<p>Informações selecionadas sobre você e sua operação.</p><span class="file-example">Exemplo: formato e regras das entregas.</span></article>'
    + '<article class="knowledge-file enter" data-memory-kind="context"><div class="file-tab">'
    + icon('folder') + '<span>Base de contexto</span></div><h3>Detalhes consultáveis</h3>'
    + '<p>Documentos, projetos e histórico recuperados quando fazem falta.</p><span class="file-example">Exemplo: fontes e decisões de uma palestra.</span></article>'
    + '<article class="knowledge-file enter" data-memory-kind="skill"><div class="file-tab">'
    + icon('file') + '<span>SKILL.md</span></div><h3>Procedimentos revisados</h3>'
    + '<p>Passos e verificações que o agente pode registrar e reutilizar.</p><span class="file-example">Exemplo: conferir a versão publicada.</span></article></div>'
    + '<div class="reuse-example"><div class="memory-controls"><button data-learning="first" aria-pressed="true">Primeira tarefa</button>'
    + '<button data-learning="reuse" aria-pressed="false">Próxima tarefa</button></div>'
    + '<div class="reuse-evidence" data-learning-evidence></div><p class="memory-message" data-learning-message aria-live="polite"></p></div>'
    + '<p class="caption">O aprendizado fica em arquivos e contexto recuperáveis, sem alterar os pesos do modelo.</p></div>',
    'Memória guarda fatos selecionados; a base conserva documentos e histórico; skills registram procedimentos. Uma correção validada pode virar verificação reutilizável na próxima tarefa.',
    [DOCS + 'user-guide/features/memory', DOCS + 'user-guide/features/skills'],
    scene='learning',
)

LEARNING = {
    'first': {
        'message': 'A página serviu o arquivo antigo. O Hermes investiga, corrige e registra a conferência do endereço final em uma skill.',
        'evidence': ['Encontrar o erro', 'Corrigir e testar', 'Atualizar SKILL.md'],
    },
    'reuse': {
        'message': 'Na próxima publicação, o Hermes consulta essa skill e compara a versão servida com o arquivo local antes de concluir.',
        'evidence': ['Recuperar a skill', 'Conferir a publicação', 'Reaproveitar a correção'],
    },
}

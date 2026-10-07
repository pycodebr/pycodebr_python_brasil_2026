"""Regression checks for the revised presentation's public narrative."""
from __future__ import annotations

import re
import sys
import unittest
import xml.etree.ElementTree as element_tree
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from presentation_content import SLIDES


class ChronologyTests(unittest.TestCase):
    def test_2026_introduces_openclaw_before_hermes(self):
        matches = [slide for slide in SLIDES if slide['id'] == 'ano-2026']
        self.assertEqual(len(matches), 1)
        item = matches[0]
        text = re.sub(r'<[^>]+>', ' ', item['body'])
        self.assertLess(text.index('Clawdbot'), text.index('Moltbot'))
        self.assertLess(text.index('Moltbot'), text.index('OpenClaw'))
        self.assertLess(text.index('OpenClaw'), text.index('Hermes Agent'))
        self.assertIn('25 de fevereiro', text)
        self.assertIn('pioneiros desta onda', text)
        self.assertIn('2025', text)
        self.assertIn('https://openclaw.ai/blog/introducing-openclaw', item['sources'])
        self.assertNotIn('evolucao', [slide['id'] for slide in SLIDES])

    def test_2022_to_2025_have_separate_scenes(self):
        ids = [item['id'] for item in SLIDES]
        for year in range(2022, 2026):
            identifier = f'ano-{year}'
            with self.subTest(year=year):
                self.assertEqual(ids.count(identifier), 1)
                item = next(slide for slide in SLIDES if slide['id'] == identifier)
                self.assertIn(str(year), item['title'])
                self.assertTrue(item['sources'])
                self.assertIn('scene', item['body'])
        self.assertEqual(ids[4:8], [f'ano-{year}' for year in range(2022, 2026)])


class ArchitectureTests(unittest.TestCase):
    def test_pending_approval_is_described_as_conditional(self):
        item = next(slide for slide in SLIDES if slide['id'] == 'aprovacao')
        self.assertIn('data-merge-label>Merge após aprovação', item['body'])
        self.assertNotIn('<span>Merge autorizado</span>', item['body'])

    def test_operation_architecture_precedes_the_use_cases(self):
        ids = [slide['id'] for slide in SLIDES]
        self.assertIn('arquitetura-operacao', ids)
        self.assertLess(ids.index('arquitetura-operacao'), ids.index('entregas'))
        item = next(slide for slide in SLIDES if slide['id'] == 'arquitetura-operacao')
        for term in ['VPS', 'Hermes Agent', 'Composio', 'MCPs', 'Base de contexto', 'GitHub', 'Tailscale', 'Cloudflare', 'Central de Operações']:
            with self.subTest(term=term):
                self.assertIn(term, item['body'])
        self.assertIn('data-architecture-focus', item['body'])
        self.assertIn('replicada e adaptada', item['body'])
        self.assertEqual(len(SLIDES), 23)

    def test_monitoring_and_reports_show_the_hermes_infrastructure(self):
        for identifier in ['monitoria', 'reports']:
            with self.subTest(identifier=identifier):
                item = next(slide for slide in SLIDES if slide['id'] == identifier)
                for term in ['network', 'VPS', 'MCP', 'Hermes', 'contexto']:
                    self.assertIn(term.lower(), item['body'].lower())
                self.assertIn('arquitetura de referência', item['summary'].lower())


class LogoViewportTests(unittest.TestCase):
    def test_mcp_and_langchain_use_square_symbols(self):
        for filename in ['mcp-icon-white.svg', 'langchain-icon-legacy-blue.svg']:
            with self.subTest(filename=filename):
                path = ROOT / 'site/assets' / filename
                self.assertTrue(path.is_file(), filename)
                svg = element_tree.parse(path).getroot()
                dimensions = [float(value) for value in svg.attrib['viewBox'].split()]
                self.assertAlmostEqual(dimensions[2] / dimensions[3], 1, places=2)
        self.assertIn('mcp-icon-white.svg', SLIDES[0]['body'])


class TopicTitleTests(unittest.TestCase):
    def test_titles_identify_the_topic_on_screen(self):
        expected = {
            'pedido-execucao': 'Linguagem natural para executar tarefas com o Hermes',
            'canais': 'Atendimento e proatividade nos canais da operação',
            'workflow': 'Workflow de IA Assistida em cinco passos',
            'harness': 'Hermes como harness e orquestrador de desenvolvimento',
            'stack': 'Deploy e observabilidade da aplicação',
            'monitoria': 'Arquitetura de monitoria com Hermes e MCPs',
            'reports': 'Reports de usuários e propostas de correção',
        }
        for identifier, title in expected.items():
            with self.subTest(identifier=identifier):
                item = next(slide for slide in SLIDES if slide['id'] == identifier)
                self.assertEqual(item['title'], title)
                text = re.sub(r'<[^>]+>', ' ', item['body'])
                self.assertIn(title, ' '.join(text.split()))


class MemoryExplanationTests(unittest.TestCase):
    def test_memory_context_and_skills_are_explained_separately(self):
        item = next(slide for slide in SLIDES if slide['id'] == 'memoria')
        self.assertEqual(item['title'], 'Memória e auto skills no Hermes')
        for kind in ['memory', 'context', 'skill']:
            with self.subTest(kind=kind):
                self.assertIn(f'data-memory-kind="{kind}"', item['body'])
        self.assertIn('data-learning-evidence', item['body'])
        self.assertIn('data-learning="first"', item['body'])
        self.assertIn('data-learning="reuse"', item['body'])
        self.assertIn('sem alterar os pesos', item['body'])


if __name__ == '__main__':
    unittest.main()

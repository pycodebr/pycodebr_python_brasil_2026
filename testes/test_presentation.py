"""Regression checks for the official presentation's public narrative (revisão 4)."""
from __future__ import annotations

import re
import unittest
import xml.etree.ElementTree as element_tree
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLIDE_FILES = sorted((ROOT / 'src' / 'slides').glob('*.html'))


def load_slides() -> list[dict]:
    slides = []
    for path in SLIDE_FILES:
        html = path.read_text(encoding='utf-8')
        slides.append({
            'id': re.search(r'data-id="([^"]+)"', html).group(1),
            'title': re.search(r'data-title="([^"]+)"', html).group(1),
            'body': html,
            'text': ' '.join(re.sub(r'<[^>]+>', ' ', html).split()),
        })
    return slides


SLIDES = load_slides()
IDS = [slide['id'] for slide in SLIDES]


def slide(identifier: str) -> dict:
    matches = [item for item in SLIDES if item['id'] == identifier]
    if len(matches) != 1:
        raise AssertionError(f'{identifier}: {len(matches)} slides')
    return matches[0]


class StructureTests(unittest.TestCase):
    def test_twenty_six_slides_with_fixed_opening_and_closing(self):
        self.assertEqual(len(SLIDES), 26)
        self.assertEqual(len(set(IDS)), 26)
        self.assertEqual(IDS[:4], ['capa', 'felipe', 'pycodebr', 'acompanhe'])
        self.assertEqual(IDS[-1], 'materiais')

    def test_build_output_matches_the_sources(self):
        index = (ROOT / 'site' / 'index.html').read_text(encoding='utf-8')
        self.assertEqual(re.findall(r'<section class="slide[^"]*" data-id="([^"]+)"', index), IDS)
        self.assertIn('<link rel="canonical" href="https://pycodebr.com.br/python-brasil-2026/">', index)
        self.assertNotIn('noindex', index)
        for extension in ('pdf', 'pptx'):
            name = f'agentes-autonomos-hermes-python-brasil-2026.{extension}'
            with self.subTest(extension=extension):
                self.assertIn(f'downloads/{name}?v=4', index)
                self.assertTrue((ROOT / 'site' / 'downloads' / name).is_file())


class ChronologyTests(unittest.TestCase):
    def test_2022_to_2026_have_separate_scenes_in_order(self):
        self.assertEqual(IDS[4:9], [f'ano-{year}' for year in range(2022, 2027)])
        for year in range(2022, 2027):
            with self.subTest(year=year):
                self.assertIn(str(year), slide(f'ano-{year}')['title'])

    def test_2026_introduces_openclaw_before_hermes(self):
        text = slide('ano-2026')['text']
        self.assertLess(text.index('Clawdbot'), text.index('Moltbot'))
        self.assertLess(text.index('Moltbot'), text.index('OpenClaw'))
        self.assertLess(text.index('OpenClaw'), text.index('Hermes Agent'))
        self.assertIn('25 de fevereiro', text)
        self.assertIn('pioneiros desta onda', text)


class ArchitectureTests(unittest.TestCase):
    def test_operation_architecture_precedes_the_use_cases(self):
        self.assertLess(IDS.index('arquitetura-operacao'), IDS.index('rotinas'))
        self.assertLess(IDS.index('arquitetura-operacao'), IDS.index('conteudo'))
        item = slide('arquitetura-operacao')
        for term in ['VPS', 'Hermes Agent', 'Composio', 'MCP', 'Base de contexto', 'GitHub', 'Tailscale', 'Central de Operações']:
            with self.subTest(term=term):
                self.assertIn(term, item['text'])
        self.assertIn('data-focus', item['body'])

    def test_merge_waits_for_approval(self):
        item = slide('aprovacao')
        self.assertIn('Merge após aprovação', item['text'])
        self.assertNotIn('Merge autorizado', item['text'])

    def test_monitoring_and_reports_show_hermes_and_mcps(self):
        for identifier in ['monitoria', 'reports']:
            text = slide(identifier)['text'].lower()
            for term in ['hermes', 'mcp', 'contexto']:
                with self.subTest(identifier=identifier, term=term):
                    self.assertIn(term, text)


class LogoViewportTests(unittest.TestCase):
    def test_mcp_and_langchain_use_square_symbols(self):
        for filename in ['mcp-icon-white.svg', 'langchain-icon-legacy-blue.svg']:
            with self.subTest(filename=filename):
                path = ROOT / 'site/assets/img/logos' / filename
                self.assertTrue(path.is_file(), filename)
                svg = element_tree.parse(path).getroot()
                dimensions = [float(value) for value in svg.attrib['viewBox'].split()]
                self.assertAlmostEqual(dimensions[2] / dimensions[3], 1, places=2)


class TopicTitleTests(unittest.TestCase):
    def test_titles_identify_the_topic_on_screen(self):
        expected = {
            'pedido-execucao': 'Linguagem natural para executar tarefas com o Hermes',
            'memoria': 'Memória e auto skills no Hermes',
            'canais': 'Atendimento e proatividade nos canais da operação',
            'workflow': 'Workflow de IA Assistida em cinco passos',
            'harness': 'Hermes como harness e orquestrador de desenvolvimento',
            'stack': 'Deploy e observabilidade da aplicação',
            'monitoria': 'Arquitetura de monitoria com Hermes e MCPs',
            'reports': 'Reports de usuários e propostas de correção',
        }
        for identifier, title in expected.items():
            with self.subTest(identifier=identifier):
                item = slide(identifier)
                self.assertEqual(item['title'], title)
                self.assertIn(title, item['text'])


class MemoryExplanationTests(unittest.TestCase):
    def test_memory_and_skills_do_not_claim_weight_changes(self):
        item = slide('memoria')
        for term in ['MEMORY.md', 'SKILL.md', 'sem alterar os pesos do modelo']:
            with self.subTest(term=term):
                self.assertIn(term, item['text'])
        self.assertIn('data-phase="first"', item['body'])
        self.assertIn('data-phase="reuse"', item['body'])


if __name__ == '__main__':
    unittest.main()

"""Exercise revision 3 through actual browser controls and viewports."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from qa_deck import GEOMETRY, require

ROOT = Path(__file__).resolve().parents[1]


def run(args):
    out = ROOT / 'qa' / args.label / args.engine
    out.mkdir(parents=True, exist_ok=True)
    content = json.loads((ROOT / 'src/content.json').read_text())
    count = len(content['slides'])
    numbers = {s['id']: s['number'] for s in content['slides']}
    require(count == 23 and len(numbers) == count, 'Revision 3 must have 23 unique scenes')
    report = {'engine': args.engine, 'url': args.url, 'slide_count': count, 'viewports': [], 'errors': [], 'interactions': []}
    with sync_playwright() as p:
        browser = getattr(p, args.engine).launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080}, reduced_motion='reduce')
        page.on('pageerror', lambda error: report['errors'].append(str(error)))
        response = page.goto(args.url + '#1', wait_until='networkidle')
        if args.url.startswith('http'):
            require(response is not None and response.status == 200, 'Public page unavailable')
        page.wait_for_function("document.documentElement.dataset.ready === 'true'")
        page.evaluate('document.fonts.ready')
        require(page.locator('.slide').count() == count, 'DOM count mismatch')

        def show(identifier):
            page.evaluate('index => window.presentation.show(index)', numbers[identifier] - 1)
            page.wait_for_timeout(70)

        for item in args.viewports.split(','):
            width, height = map(int, item.split('x'))
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(90)
            batch = {'width': width, 'height': height, 'scenes': []}
            captures = out / item
            captures.mkdir(exist_ok=True)
            for scene in content['slides']:
                show(scene['id'])
                active = page.locator('.slide.active')
                result = active.evaluate(GEOMETRY)
                overlaps = active.evaluate("""slide => [...slide.querySelectorAll('.network')].flatMap(network => {
                    const content = network.querySelector('.network-content');
                    if (!content) return [];
                    const outer = network.getBoundingClientRect(), inner = content.getBoundingClientRect();
                    return inner.bottom > outer.bottom + 2 ? [{type:'network-container',bottom:inner.bottom,container:outer.bottom}] : [];
                })""")
                result['issues'].extend(overlaps)
                result.update(number=scene['number'], id=scene['id'])
                require(page.locator('#counter').inner_text() == f'{scene["number"]} / {count}', 'Counter mismatch')
                if (width, height) in [(1920, 1080), (390, 844), (320, 568), (768, 1024)]:
                    for selector in ['#toolbar', '#progress']:
                        page.locator(selector).evaluate("element => element.style.visibility = 'hidden'")
                    active.screenshot(path=str(captures / f'slide-{scene["number"]:02d}.png'), animations='disabled')
                    for selector in ['#toolbar', '#progress']:
                        page.locator(selector).evaluate("element => element.style.visibility = ''")
                batch['scenes'].append(result)
            report['viewports'].append(batch)
            (out / 'layout.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')

        page.set_viewport_size({'width': 1440, 'height': 900})
        for year in range(2022, 2027):
            show(f'ano-{year}')
            require(page.locator('.slide.active').get_attribute('data-id') == f'ano-{year}', 'Year scene failed')
        report['interactions'].append('annual scenes')
        show('memoria')
        for stage in ['first', 'reuse']:
            page.locator(f'[data-learning="{stage}"]').click()
            require(page.locator('[data-scene="learning"]').get_attribute('data-stage') == stage, 'Learning state failed')
            require(page.locator('[data-learning-message]').inner_text() == content['interactions']['learning'][stage]['message'], 'Learning explanation mismatch')
            require(page.locator('[data-learning-evidence] span').count() == 3, 'Missing evidence steps')
            require(not page.locator('.slide.active').evaluate(GEOMETRY)['issues'], 'Learning state layout failed')
        report['interactions'].append('memory and reuse')
        show('arquitetura-operacao')
        for focus, explanation in content['interactions']['architecture'].items():
            page.locator(f'[data-architecture-focus="{focus}"]').click()
            require(page.locator('[data-scene="architecture"]').get_attribute('data-focus') == focus, 'Architecture focus failed')
            require(page.locator('[data-architecture-explanation]').inner_text() == explanation, 'Architecture explanation mismatch')
            require(not page.locator('.slide.active').evaluate(GEOMETRY)['issues'], 'Architecture focus layout failed')
        report['interactions'].append('architecture focus')
        show('workflow')
        for step in range(5):
            page.locator(f'[data-workflow-step="{step}"]').click()
            require(page.locator('[data-step-number]').inner_text() == f'{step+1:02d}', 'Workflow state failed')
            require(not page.locator('.slide.active').evaluate(GEOMETRY)['issues'], 'Workflow layout failed')
        page.keyboard.press('PageDown')
        require(page.locator('#counter').inner_text() == f'{numbers["workflow"]+1} / {count}', 'Keyboard stopped after clicking a control')
        report['interactions'].append('workflow and keyboard after interaction')
        show('monitoria')
        for signal in ['latency', 'queue', 'errors']:
            page.locator(f'button[data-signal="{signal}"]').click()
            require(page.locator('[data-scene="monitoring"]').get_attribute('data-signal') == signal, 'Telemetry state failed')
            require(not page.locator('.slide.active').evaluate(GEOMETRY)['issues'], 'Telemetry layout failed')
        report['interactions'].append('telemetry states')
        show('reports')
        page.locator('button[data-report="feature"]').click()
        require('filtros salvos' in page.locator('[data-pr-title]').text_content(), 'Report did not reach PR')
        show('aprovacao')
        require(page.locator('[data-merge]').is_disabled(), 'Merge enabled before approval')
        require(page.locator('[data-merge-label]').inner_text() == 'Merge após aprovação', 'Pending state falsely claims authorization')
        page.locator('[data-approve]').click()
        require(page.locator('[data-merge]').is_enabled(), 'Approval did not enable merge')
        require(page.locator('[data-merge-label]').inner_text() == 'Merge autorizado', 'Authorized label failed')
        page.locator('[data-merge]').click()
        page.wait_for_function("document.querySelector('[data-scene=approval]').dataset.approval === 'completed'")
        page.locator('[data-reset-approval]').click()
        page.locator('[data-reject]').click()
        require(page.locator('[data-merge]').is_disabled(), 'Rejection did not block merge')
        show('reports')
        page.locator('button[data-report="bug"]').click()
        require(page.locator('[data-scene="approval"]').get_attribute('data-approval') == 'pending', 'Changed report retained approval')
        report['interactions'].append('reports and approval gates')
        page.evaluate('document.activeElement.blur()')
        page.keyboard.press('Home')
        require(page.locator('#counter').inner_text() == f'1 / {count}', 'Home failed')
        page.keyboard.press('ArrowRight')
        require(page.locator('#counter').inner_text() == f'2 / {count}', 'Arrow failed')
        page.keyboard.press('End')
        require(page.locator('#counter').inner_text() == f'{count} / {count}', 'End failed')
        page.click('#open-overview')
        require(page.locator('#overview-list button').count() == count, 'Overview count failed')
        page.locator('#overview-list button').nth(3).click()
        require(page.locator('#counter').inner_text() == f'4 / {count}', 'Overview navigation failed')
        page.goto(args.url + '#99', wait_until='networkidle')
        require(page.locator('#counter').inner_text() == f'{count} / {count}', 'Old numeric hash was not clamped')
        page.goto(args.url + '#workflow', wait_until='networkidle')
        require(page.locator('#counter').inner_text() == f'{numbers["workflow"]} / {count}', 'Semantic hash failed')
        page.goto(args.url, wait_until='networkidle')
        require(page.locator('#counter').inner_text() == f'{numbers["workflow"]} / {count}', 'Position restore failed')
        page.goto(args.url + '#1', wait_until='networkidle')
        require(page.locator('#counter').inner_text() == f'1 / {count}', 'Explicit hash did not win')
        report['interactions'].append('navigation, hashes and position')
        page.emulate_media(reduced_motion='no-preference')
        page.wait_for_function("getComputedStyle(document.querySelector('.orbital-spin')).animationName !== 'none'")
        moving = page.locator('.orbital-spin')
        before = moving.evaluate('element => getComputedStyle(element).transform')
        page.wait_for_function("previous => getComputedStyle(document.querySelector('.orbital-spin')).transform !== previous", arg=before)
        after = moving.evaluate('element => getComputedStyle(element).transform')
        require(before != after, 'Motion not observed')
        show('arquitetura-operacao')
        edge = page.locator('.slide.active .edge').first
        before = edge.evaluate('element => getComputedStyle(element).strokeDashoffset')
        page.wait_for_function("previous => getComputedStyle(document.querySelector('.slide.active .edge')).strokeDashoffset !== previous", arg=before)
        require(before != edge.evaluate('element => getComputedStyle(element).strokeDashoffset'), 'Network motion not observed')
        page.click('#open-menu')
        page.click('#motion')
        require(edge.evaluate('element => getComputedStyle(element).animationName') == 'none', 'Network motion pause failed')
        page.click('#motion')
        page.emulate_media(reduced_motion='reduce')
        require(edge.evaluate('element => getComputedStyle(element).animationName') == 'none', 'Reduced motion failed')
        require(page.locator('#menu a[download]').count() == 2, 'Missing downloads')
        page.click('#close-menu')
        report['interactions'].append('observed motion and pause')
        context = browser.new_context()
        context.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
        blocked = context.new_page()
        blocked.goto(args.url + '#workflow', wait_until='networkidle')
        require(blocked.locator('#counter').inner_text() == f'{numbers["workflow"]} / {count}', 'Storage denial broke navigation')
        blocked.click('#next')
        require(blocked.locator('#counter').inner_text() == f'{numbers["workflow"]+1} / {count}', 'Storage denial blocked next')
        context.close()
        browser.close()
    issues = [{'viewport': f'{v["width"]}x{v["height"]}', 'slide': s['number'], 'issues': s['issues'], 'broken': s['broken']} for v in report['viewports'] for s in v['scenes'] if s['issues'] or s['broken'] or s['documentWidth'] > s['viewportWidth']+2]
    report['passed'] = not issues and not report['errors']
    report['interactions_passed'] = True
    (out / 'layout.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    images = sorted((out / '1920x1080').glob('slide-*.png'))
    for start in range(0, len(images), 6):
        batch = images[start:start+6]
        sheet = Image.new('RGB', (1280, 390*((len(batch)+1)//2)), '#03090e')
        draw = ImageDraw.Draw(sheet)
        for i, path in enumerate(batch):
            image = Image.open(path).convert('RGB')
            image.thumbnail((640, 360))
            x, y = i % 2 * 640, i // 2 * 390
            sheet.paste(image, (x, y))
            draw.text((x+12, y+365), path.stem, fill='white')
        sheet.save(out / f'contact-{start//6+1}.jpg', quality=92)
    print(json.dumps({'engine': args.engine, 'passed': report['passed'], 'viewports': len(report['viewports']), 'scenes_checked': sum(len(v['scenes']) for v in report['viewports']), 'issues': issues, 'runtime_errors': report['errors']}, ensure_ascii=False, indent=2))
    if not report['passed']:
        raise SystemExit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default=(ROOT / 'site/index.html').as_uri())
    parser.add_argument('--engine', choices=['chromium', 'firefox', 'webkit'], default='chromium')
    parser.add_argument('--viewports', default='1920x1080,1440x900,1366x768,1024x768,768x1024,390x844,320x568,844x390,2560x1440,3840x2160')
    parser.add_argument('--label', default='revision-v3')
    run(parser.parse_args())


if __name__ == '__main__':
    main()

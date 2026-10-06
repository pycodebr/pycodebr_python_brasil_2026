"""Exercise all slides in an adaptive viewport matrix and save evidence."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

GEOMETRY = """slide => {
 const issues=[]; const b=slide.getBoundingClientRect();
 const foot=slide.querySelector('.slide-foot').getBoundingClientRect();
 const head=slide.querySelector('.slide-head');
 const scene=slide.querySelector('.scene');
 for(const node of slide.querySelectorAll('h1,h2,h3,p,button,.pill,.history-year,.workflow-detail,.network-node,.worker,.case,.phone-mini,.approval-phone,.signal-tabs,.qr')){
  const style=getComputedStyle(node); if(style.display==='none'||style.visibility==='hidden')continue;
  const r=node.getBoundingClientRect(); if(!r.width||!r.height)continue;
  if(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2) issues.push({type:'canvas',element:node.className||node.tagName,text:node.textContent.slice(0,65),bounds:[r.x,r.y,r.width,r.height]});
  if(!node.closest('.slide-foot') && r.bottom>foot.top-12 && r.top<foot.bottom) issues.push({type:'footer',element:node.className||node.tagName,text:node.textContent.slice(0,65),bottom:r.bottom,footer:foot.top});
 }
 if(head&&scene&&head.getBoundingClientRect().bottom>scene.getBoundingClientRect().top+2)issues.push({type:'header-scene'});
 const walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode; if(!node.textContent.trim())continue;
  const element=node.parentElement;if(!element||element.closest('svg,script'))continue;
  const style=getComputedStyle(element);if(style.visibility==='hidden'||style.display==='none'||!element.getClientRects().length)continue;
  const range=document.createRange();range.selectNodeContents(node);const text=range.getBoundingClientRect();
  if(text.right>b.right+2||text.left<b.left-2)issues.push({type:'text-width',text:node.textContent.slice(0,65)});
 }
 const broken=[...slide.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'));
 return {issues,broken,slideHeight:b.height,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,reading:document.body.classList.contains('reading')};
}"""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default=(ROOT / 'site/index.html').as_uri())
    parser.add_argument('--engine', choices=['chromium', 'firefox', 'webkit'], default='chromium')
    parser.add_argument('--viewports', default='1920x1080,1440x900,1366x768,1024x768,768x1024,390x844,320x568,844x390,2560x1440,3840x2160')
    parser.add_argument('--label', default='current')
    args = parser.parse_args()
    out = ROOT / 'qa' / args.label / args.engine
    out.mkdir(parents=True, exist_ok=True)
    content = json.loads((ROOT / 'src/content.json').read_text())
    count = len(content['slides'])
    report = {'engine': args.engine, 'url': args.url, 'slide_count': count, 'viewports': [], 'errors': []}
    with sync_playwright() as p:
        browser = getattr(p, args.engine).launch(headless=True)
        page = browser.new_page(viewport={'width':1920, 'height':1080}, reduced_motion='reduce')
        page.on('pageerror', lambda e: report['errors'].append(str(e)))
        response = page.goto(args.url + '#1', wait_until='networkidle')
        if args.url.startswith('http'):
            require(response is not None and response.status == 200, 'Public page unavailable')
        page.wait_for_function("document.documentElement.dataset.ready === 'true'")
        page.evaluate('document.fonts.ready')
        require(page.locator('.slide').count() == count == 18, 'Wrong slide count')
        for item in args.viewports.split(','):
            width, height = [int(v) for v in item.split('x')]
            page.set_viewport_size({'width':width, 'height':height})
            page.wait_for_timeout(90)
            batch = {'width':width, 'height':height, 'scenes':[]}
            captures = out / item
            captures.mkdir(exist_ok=True)
            for index in range(count):
                page.evaluate('index => window.presentation.show(index)', index)
                page.wait_for_timeout(60)
                active = page.locator('.slide.active')
                result = active.evaluate(GEOMETRY)
                result['number'] = index + 1
                result['id'] = content['slides'][index]['id']
                require(page.locator('#counter').inner_text() == f'{index + 1} / {count}', 'Counter mismatch')
                if (width,height) in [(1920,1080),(390,844),(320,568),(768,1024)]:
                    page.locator('#toolbar').evaluate("e=>e.style.visibility='hidden'")
                    page.locator('#progress').evaluate("e=>e.style.visibility='hidden'")
                    active.screenshot(path=str(captures / f'slide-{index+1:02d}.png'),animations='disabled')
                    page.locator('#toolbar').evaluate("e=>e.style.visibility=''")
                    page.locator('#progress').evaluate("e=>e.style.visibility=''")
                batch['scenes'].append(result)
            report['viewports'].append(batch)
            (out / 'layout.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
        page.set_viewport_size({'width':1440,'height':900})
        page.evaluate('window.presentation.show(4)')
        for year in content['interactions']['timeline']:
            page.locator(f'button[data-year="{year}"]').click()
            require(page.locator('[data-scene="timeline"]').get_attribute('data-year') == year, 'Timeline state failed')
        page.evaluate('window.presentation.show(7)')
        for stage in ['first','reuse']:
            page.locator(f'[data-learning="{stage}"]').click()
            require(page.locator('[data-scene="learning"]').get_attribute('data-stage') == stage, 'Learning state failed')
        page.evaluate('window.presentation.show(10)')
        for step in range(5):
            page.locator(f'[data-workflow-step="{step}"]').click()
            require(page.locator('[data-step-number]').inner_text()==f'{step+1:02d}', 'Workflow state failed')
            require(not page.locator('.slide.active').evaluate(GEOMETRY)['issues'], 'Workflow state layout failed')
        page.evaluate('window.presentation.show(13)')
        for signal in ['latency','queue','errors']:
            page.locator(f'button[data-signal="{signal}"]').click()
            require(page.locator('[data-scene="monitoring"]').get_attribute('data-signal') == signal, 'Telemetry state failed')
        page.evaluate('window.presentation.show(14)')
        page.locator('button[data-report="feature"]').click()
        require('filtros salvos' in page.locator('[data-pr-title]').text_content(), 'Report did not reach PR scene')
        page.evaluate('window.presentation.show(15)')
        require(page.locator('[data-merge]').is_disabled(), 'Merge enabled before approval')
        page.locator('[data-approve]').click()
        require(page.locator('[data-merge]').is_enabled(), 'Approval did not enable merge')
        page.locator('[data-merge]').click()
        page.wait_for_function("document.querySelector('[data-scene=approval]').dataset.approval === 'completed'")
        page.locator('[data-reset-approval]').click()
        page.locator('[data-reject]').click()
        require(page.locator('[data-merge]').is_disabled(), 'Rejection did not block merge')
        page.evaluate('window.presentation.show(14)')
        page.locator('button[data-report="bug"]').click()
        require(page.locator('[data-scene="approval"]').get_attribute('data-approval') == 'pending', 'Changed report kept approval')
        page.evaluate('document.activeElement.blur()')
        page.keyboard.press('Home')
        require(page.locator('#counter').inner_text().startswith('1 /'), 'Home failed')
        page.keyboard.press('ArrowRight')
        require(page.locator('#counter').inner_text().startswith('2 /'), 'Next key failed')
        page.keyboard.press('End')
        require(page.locator('#counter').inner_text().startswith('18 /'), 'End failed')
        page.click('#open-overview')
        require(page.locator('#overview-list button').count()==18,'Overview missing slides')
        page.locator('#overview-list button').nth(3).click()
        require(page.locator('#counter').inner_text().startswith('4 /'),'Overview selection failed')
        page.goto(args.url + '#99',wait_until='networkidle')
        require(page.locator('#counter').inner_text().startswith('18 /'),'Old hash was not clamped')
        page.goto(args.url + '#workflow',wait_until='networkidle')
        require(page.locator('#counter').inner_text().startswith('11 /'),'Semantic hash failed')
        page.goto(args.url,wait_until='networkidle')
        require(page.locator('#counter').inner_text().startswith('11 /'),'Position not restored')
        page.goto(args.url+'#1',wait_until='networkidle')
        require(page.locator('#counter').inner_text().startswith('1 /'),'Explicit hash did not win')
        page.emulate_media(reduced_motion='no-preference')
        page.wait_for_timeout(80)
        moving=page.locator('.orbital-spin')
        before=moving.evaluate('e=>getComputedStyle(e).transform')
        page.wait_for_timeout(250)
        after=moving.evaluate('e=>getComputedStyle(e).transform')
        require(before!=after,'Motion was not observed')
        page.click('#open-menu')
        page.click('#motion')
        require(moving.evaluate('e=>getComputedStyle(e).animationName')=='none','Motion pause failed')
        page.click('#motion')
        page.emulate_media(reduced_motion='reduce')
        require(moving.evaluate('e=>getComputedStyle(e).animationName')=='none','Reduced-motion preference failed')
        require(page.locator('#menu a[download]').count()==2,'Missing downloads')
        page.click('#close-menu')
        report['interactions_passed'] = True
        page.close()
        context=browser.new_context()
        context.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
        blocked=context.new_page()
        blocked.goto(args.url+'#11',wait_until='networkidle')
        require(blocked.locator('#counter').inner_text().startswith('11 /'),'Storage denial broke navigation')
        blocked.click('#next')
        require(blocked.locator('#counter').inner_text().startswith('12 /'),'Navigation with blocked storage failed')
        context.close()
        browser.close()
    issues=[{'viewport':f"{v['width']}x{v['height']}",'slide':s['number'],'issues':s['issues'],'broken':s['broken']} for v in report['viewports'] for s in v['scenes'] if s['issues'] or s['broken'] or s['documentWidth']>s['viewportWidth']+2]
    report['passed']=not issues and not report['errors']
    (out/'layout.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    images=sorted((out/'1920x1080').glob('slide-*.png'))
    for start in range(0,len(images),6):
        batch=images[start:start+6]
        sheet=Image.new('RGB',(1280,390*((len(batch)+1)//2)),'#03090e');draw=ImageDraw.Draw(sheet)
        for i,path in enumerate(batch):
            img=Image.open(path).convert('RGB');img.thumbnail((640,360));x=i%2*640;y=i//2*390;sheet.paste(img,(x,y));draw.text((x+12,y+365),path.stem,fill='white')
        sheet.save(out/f'contact-{start//6+1}.jpg',quality=92)
    print(json.dumps({'engine':args.engine,'passed':report['passed'],'viewports':len(report['viewports']),'scenes_checked':sum(len(v['scenes']) for v in report['viewports']),'issues':issues,'runtime_errors':report['errors']},ensure_ascii=False,indent=2))
    if not report['passed']:
        raise SystemExit(1)


if __name__=='__main__':
    main()

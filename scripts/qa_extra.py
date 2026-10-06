"""Additional checks for QR codes, touchscreen controls and desktop fullscreen."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default=(ROOT / 'site/index.html').as_uri())
    args = parser.parse_args()
    result = {'qr_codes':[], 'touchscreen':False, 'fullscreen':False}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,reduced_motion='reduce')
        page = context.new_page()
        page.goto(args.url+'#4',wait_until='networkidle')
        page.wait_for_function("document.documentElement.dataset.ready === 'true'")
        for slide_number, expected in [(4,'https://pycodebr.com.br/python-brasil-2026'),(3,'https://www.instagram.com/pycodebr/')]:
            page.evaluate('n=>window.presentation.show(n-1)',slide_number)
            qr=page.locator('.slide.active .qr')
            qr.scroll_into_view_if_needed()
            image=qr.screenshot()
            matrix=cv2.imdecode(np.frombuffer(image,dtype=np.uint8),cv2.IMREAD_COLOR)
            decoded,_,_=cv2.QRCodeDetector().detectAndDecode(matrix)
            require(decoded==expected,'Rendered QR failed: '+str(slide_number))
            result['qr_codes'].append({'slide':slide_number,'destination':decoded,'rendered_on_mobile':True})
        page.locator('#next').tap()
        require(page.locator('#counter').inner_text()=='4 / 18','Touch next failed')
        page.locator('#open-overview').tap()
        page.locator('#overview-list button').nth(10).tap()
        require(page.locator('#counter').inner_text()=='11 / 18','Touch overview failed')
        page.locator('button[data-workflow-step="4"]').tap()
        require(page.locator('[data-step-number]').inner_text()=='05','Touch workflow failed')
        result['touchscreen']=True
        page.keyboard.press('PageDown')
        require(page.locator('#counter').inner_text()=='12 / 18','PageDown failed after an interactive control')
        page.keyboard.press('ArrowRight')
        require(page.locator('#counter').inner_text()=='13 / 18','Arrow navigation failed after interaction')
        result['keyboard_after_interaction']=True
        page.evaluate('window.presentation.show(0)')
        page.wait_for_timeout(80)
        toolbar=page.locator('#toolbar').bounding_box()
        title=page.locator('.slide.active h1').bounding_box()
        require(title['y']>=toolbar['y']+toolbar['height'],'Toolbar covers the first heading')
        page.screenshot(path=str(ROOT/'qa/mobile-ui-390.png'))
        context.close()
        page=browser.new_page(viewport={'width':1440,'height':900})
        page.goto(args.url+'#1',wait_until='networkidle')
        page.click('#open-menu')
        page.click('#fullscreen')
        page.wait_for_function('Boolean(document.fullscreenElement)')
        page.click('#fullscreen')
        page.wait_for_function('!document.fullscreenElement')
        result['fullscreen']=True
        browser.close()
    result['passed']=True
    (ROOT/'qa/extra.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()

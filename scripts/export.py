"""Export the presentation to searchable PDF and visual PowerPoint."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from zipfile import ZipFile

import cv2
import pymupdf
from PIL import Image, ImageChops, ImageDraw, ImageStat
from playwright.sync_api import sync_playwright
from pptx import Presentation
from pptx.util import Inches

ROOT = Path(__file__).resolve().parents[1]
NAME = 'agentes-autonomos-hermes-python-brasil-2026'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> None:
    content = json.loads((ROOT / 'src/content.json').read_text())
    slides = content['slides']
    captures = ROOT / 'qa/exports/captures'
    captures.mkdir(parents=True, exist_ok=True)
    downloads = ROOT / 'site/downloads'
    downloads.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width':1920,'height':1080},reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / 'site/index.html').as_uri() + '?export=1#1',wait_until='networkidle')
        page.wait_for_function("document.documentElement.dataset.ready === 'true'")
        page.evaluate('document.fonts.ready')
        page.evaluate('window.presentation.exportState()')
        for i, slide in enumerate(slides):
            page.evaluate('index=>window.presentation.show(index)', i)
            page.wait_for_timeout(60)
            active = page.locator('.slide.active')
            broken = active.locator('img').evaluate_all('nodes=>nodes.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)')
            require(not broken, f'Broken export asset on slide {i+1}')
            path = captures / f'slide-{i+1:02d}.png'
            active.screenshot(path=str(path),animations='disabled')
            require(Image.open(path).size==(1920,1080),'Wrong export dimensions')
        page.evaluate('window.presentation.exportState()')
        page.evaluate('title=>document.title=title',content['title'])
        page.emulate_media(media='print',reduced_motion='reduce')
        page.pdf(path=str(downloads / (NAME + '.pdf')),width='20in',height='11.25in',print_background=True,prefer_css_page_size=True,tagged=True)
        require(not errors,'Runtime error during export')
        browser.close()
    pdf = pymupdf.open(downloads / (NAME + '.pdf'))
    require(len(pdf)==len(slides),'PDF count mismatch')
    pdf_comparisons = []
    for i, page in enumerate(pdf):
        require('@pycodebr' in page.get_text(),f'Missing searchable PDF text on page {i+1}')
        require(abs(page.rect.width/page.rect.height-16/9)<.001,'Wrong PDF aspect ratio')
        pix = page.get_pixmap(matrix=pymupdf.Matrix(4/3,4/3))
        rendered = Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
        original = Image.open(captures / f'slide-{i+1:02d}.png').convert('RGB')
        if rendered.size != original.size:
            rendered = rendered.resize(original.size)
        error = sum(ImageStat.Stat(ImageChops.difference(rendered,original)).mean)/3
        pdf_comparisons.append({'slide':i+1,'mean_absolute_error':round(error,4)})
        require(error<5,f'PDF composition differs from the slide at {i+1}: {error}')
    for number in [1,3,4,11,13,16,18]:
        pdf[number-1].get_pixmap(matrix=pymupdf.Matrix(1,1)).save(ROOT / f'qa/exports/pdf-{number:02d}.png')
    pptx = Presentation()
    pptx.slide_width = Inches(20)
    pptx.slide_height = Inches(11.25)
    pptx.core_properties.title = content['title']
    pptx.core_properties.author = 'Felipe Azambuja · PycodeBR'
    pptx.core_properties.subject = 'Python Brasil 2026 · revisão 2'
    pptx.core_properties.comments = 'Versão estática em imagens por slide. Animações e interações estão na apresentação HTML.'
    for i, item in enumerate(slides):
        slide = pptx.slides.add_slide(pptx.slide_layouts[6])
        shape = slide.shapes.add_picture(str(captures / f'slide-{i+1:02d}.png'),0,0,pptx.slide_width,pptx.slide_height)
        shape.name = item['title']
        shape._element.nvPicPr.cNvPr.set('descr',item['summary'])
        slide.notes_slide.notes_text_frame.text = '\n\n'.join([item['title'],item['summary'],'Slides e materiais: '+content['url'],'Repositório: '+content['repository'],'Referências: '+'; '.join(item['sources'])])
    pptx.save(downloads / (NAME+'.pptx'))
    require(len(Presentation(downloads / (NAME+'.pptx')).slides)==len(slides),'PPTX count mismatch')
    with ZipFile(downloads / (NAME+'.pptx')) as archive:
        require(archive.testzip() is None,'Invalid PPTX ZIP')
    for filename,expected in [('instagram-qr.png','https://www.instagram.com/pycodebr/'),('audience-qr.png','https://pycodebr.com.br/python-brasil-2026')]:
        decoded,_,_=cv2.QRCodeDetector().detectAndDecode(cv2.imread(str(ROOT/'site/assets'/filename)))
        require(decoded==expected,'QR destination mismatch: '+filename)
    for start in range(0,len(slides),6):
        paths = [captures/f'slide-{n+1:02d}.png' for n in range(start,min(start+6,len(slides)))]
        sheet=Image.new('RGB',(1280,390*((len(paths)+1)//2)),'#03090e');draw=ImageDraw.Draw(sheet)
        for index,path in enumerate(paths):
            img=Image.open(path).convert('RGB');img.thumbnail((640,360));x=index%2*640;y=index//2*390;sheet.paste(img,(x,y));draw.text((x+12,y+365),path.stem,fill='white')
        sheet.save(ROOT/f'qa/exports/contact-{start//6+1}.jpg',quality=92)
    report={'slides':len(slides),'pdf_pages':len(pdf),'pdf_searchable':True,'pdf_visual_comparisons':pdf_comparisons,'pptx_slides':len(slides),'pptx_mode':'static full-bleed images','qr_codes_decoded':2,'files':[],'passed':True}
    for extension in ['pdf','pptx']:
        file=downloads/(NAME+'.'+extension)
        report['files'].append({'name':file.name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    (ROOT/'qa/exports/report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    pdf.close()
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()

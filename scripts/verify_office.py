"""Compare an Impress-rendered PDF with the original PowerPoint scene images."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
NAME = 'agentes-autonomos-hermes-python-brasil-2026'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', type=Path, default=ROOT/'qa/office'/(NAME+'.pdf'))
    args = parser.parse_args()
    document = pymupdf.open(args.pdf)
    count = len(json.loads((ROOT/'src/content.json').read_text())['slides'])
    if len(document) != count:
        raise RuntimeError('Office page count differs from the presentation')
    comparisons = []
    for i,page in enumerate(document):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(4/3,4/3))
        rendered = Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
        reference = Image.open(ROOT/f'qa/exports/captures/slide-{i+1:02d}.png').convert('RGB')
        if rendered.size != reference.size:
            rendered = rendered.resize(reference.size)
        error = sum(ImageStat.Stat(ImageChops.difference(rendered,reference)).mean)/3
        if error > 5:
            raise RuntimeError(f'Office composition differs on slide {i+1}: {error}')
        comparisons.append({'slide':i+1,'mean_absolute_error':round(error,4)})
        if i in {1,3,10,12,15,17}:
            rendered.save(ROOT/f'qa/office/slide-{i+1:02d}.jpg',quality=92)
    result = {'slides':count,'comparisons':comparisons,'passed':True}
    (ROOT/'qa/office/report.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'slides':count,'passed':True,'maximum_mean_error':max(c['mean_absolute_error'] for c in comparisons)}))


if __name__=='__main__':
    main()

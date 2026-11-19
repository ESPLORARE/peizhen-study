import re,json,fitz
from pathlib import Path
root=Path(__file__).resolve().parent
data=json.loads((root/'question-bank.json').read_text(encoding='utf-8'))
doc=fitz.open(next(root.parent.glob('*.pdf')))
raw='\n'.join(p.get_text(sort=True) for p in doc)
sections=re.split(r'(?m)^(?:单选题|多选题|判断题)\s*$',raw)[1:]
normalize=lambda s:re.sub(r'\s+','',s)
seen=0
for typ,sec in zip(('single','multiple','boolean'),sections):
    blocks=re.split(r'(?m)^\d+、',sec)[1:]
    qs=[q for q in data['questions'] if q['type']==typ]
    assert len(blocks)==len(qs)
    for q,b in zip(qs,blocks):
        opts='' if typ=='boolean' else ''.join(o['key']+'.'+o['text'] for o in q['options'])
        ans=('正确' if q['answer']==['T'] else '错误') if typ=='boolean' else ''.join(q['answer'])
        assembled=q['title']+opts+'答案：'+ans+'解析：'+q['explanation']
        assert normalize(assembled)==normalize(b),(typ,q['number'])
        assert q['title'][:8] in doc[q['page']-1].get_text().replace('\n',''),q['id']
        seen+=1
assert seen==470
print('All 470 stems, options, answers and explanations exactly match PDF text ignoring whitespace. All source page starts verified.')

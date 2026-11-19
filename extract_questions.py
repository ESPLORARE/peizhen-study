"""Reproduce the question bank from the supplied PDF, preserving source answers."""
import json, re, hashlib
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parent
pdf = next(ROOT.parent.glob('*.pdf'))
doc = fitz.open(pdf)
text = '\n'.join(f'\n@@PAGE:{i+1}@@\n{p.get_text(sort=True)}' for i,p in enumerate(doc))
headings = list(re.finditer(r'(?m)^(单选题|多选题|判断题)\s*$', text))
types = {'单选题':'single','多选题':'multiple','判断题':'boolean'}
questions=[]
def clean(s):
    return re.sub(r'\s*\n\s*', '', re.sub(r'@@PAGE:\d+@@', '', s)).strip()

def category(t,n,title):
    if t=='single':
        for a,b,c in [(1,17,'职业道德'),(18,34,'康复与中医'),(35,38,'药品与器械'),(39,44,'医疗保障'),(45,59,'预防保健'),(60,69,'现场急救'),(70,79,'健康素养'),(80,104,'医学基础'),(105,108,'职业健康'),(109,111,'心理健康'),(112,112,'职业健康'),(113,123,'心理健康'),(124,139,'营养与食品'),(140,140,'心理健康'),(141,141,'营养与食品'),(142,146,'职业健康'),(147,163,'劳动法律'),(164,180,'健康档案'),(181,185,'咨询与访视'),(186,218,'康复与中医'),(219,242,'陪诊与导诊'),(243,251,'药品与器械'),(252,256,'陪诊与导诊'),(257,258,'咨询与访视'),(259,259,'医学基础'),(260,262,'心理健康'),(263,265,'康复与中医'),(266,296,'咨询与访视'),(297,300,'陪诊与导诊')]:
            if a<=n<=b:return c
    if t=='multiple':
        for a,b,c in [(1,4,'职业道德'),(5,9,'康复与中医'),(10,10,'药品与器械'),(11,12,'医疗保障'),(13,15,'预防保健'),(16,18,'现场急救'),(19,21,'健康素养'),(22,29,'医学基础'),(30,34,'陪诊与导诊'),(35,44,'康复与中医'),(45,46,'医学基础'),(47,47,'心理健康'),(48,53,'医学基础'),(54,54,'心理健康'),(55,56,'陪诊与导诊'),(57,58,'咨询与访视'),(59,60,'陪诊与导诊'),(61,61,'咨询与访视'),(62,62,'陪诊与导诊'),(63,63,'咨询与访视'),(64,64,'陪诊与导诊'),(65,65,'咨询与访视'),(66,66,'陪诊与导诊'),(67,67,'咨询与访视'),(68,68,'陪诊与导诊'),(69,70,'营养与食品')]:
            if a<=n<=b:return c
    for pattern,cat in [('职业道德|道德|职业理想','职业道德'),('康复|残损|残疾|残障|中医|天人相应|化疗|功能观|药剂师|形神|治未病','康复与中医'),('非处方|双跨','药品与器械'),('婴儿|更年期','预防保健'),('急救|溺水','现场急救'),('健康档案','健康档案'),('劳动|工资','劳动法律'),('访视|倾听|提问|开放性问题','咨询与访视'),('咨询','咨询与访视'),('陪诊','陪诊与导诊'),('细胞|神经组织','医学基础'),('抑郁|厌食','心理健康'),('维生素|钠|膳食|鱼类|植物性|营养素','营养与食品')]:
        if re.search(pattern,title): return cat
    return '健康素养'

notes={
 'single-44':'原解析前半句将“医师”条件写成药店条件，后半句又说明该条件适用于医疗机构，原文表述存在矛盾。',
 'single-155':'题干泛称“加班”，而原解析仅解释法定休假日工作的工资比例，适用情形表述不完整。',
 'single-245':'原答案为 C（中度风险），但原解析描述的是“较高风险”，答案与解析存在不一致。',
 'boolean-37':'原答案为“错误”，但原解析包含“预防疾病”，与题干表述存在不一致。',
 'single-285':'原 PDF 的解析在“点头或简单应”处结束，原文不完整。',
 'single-286':'原 PDF 的解析在“容易造成回”处结束，原文不完整。',
 'multiple-33':'原 PDF 的解析在“确保患者理”处结束，原文不完整。',
 'multiple-55':'原 PDF 的解析在“应该了”处结束，原文不完整。',
 'multiple-57':'原 PDF 的解析在“目的是了”处结束，原文不完整。',
 'boolean-67':'原 PDF 的解析在“没有限定”处结束，原文不完整。',
}
for hi,h in enumerate(headings):
    section=text[h.end():headings[hi+1].start() if hi+1<len(headings) else len(text)]
    starts=list(re.finditer(r'(?m)^(\d+)、',section))
    t=types[h.group(1)]
    for i,m in enumerate(starts):
        block=section[m.end():starts[i+1].start() if i+1<len(starts) else len(section)]
        global_start=h.end()+m.start()
        page=int(list(re.finditer(r'@@PAGE:(\d+)@@',text[:global_start]))[-1].group(1))
        endpage=page
        pmarkers=list(re.finditer(r'@@PAGE:(\d+)@@',block))
        if pmarkers:endpage=int(pmarkers[-1].group(1))
        block=re.sub(r'@@PAGE:\d+@@','',block)
        am=re.search(r'答案[：:]\s*(.*?)\n',block)
        assert am, (t,m.group(1),'missing answer')
        before=block[:am.start()]
        exp=re.search(r'解析[：:](.*)',block[am.end():],re.S)
        assert exp,(t,m.group(1),'missing explanation')
        opts=list(re.finditer(r'(?m)^([A-H])[.．、]\s*',before))
        title=clean(before[:opts[0].start()] if opts else before)
        options=[{'key':o.group(1),'text':clean(before[o.end():opts[k+1].start() if k+1<len(opts) else len(before)])} for k,o in enumerate(opts)]
        answer=clean(am.group(1))
        if t=='boolean':
            assert not options and answer in ('正确','错误')
            options=[{'key':'T','text':'正确'},{'key':'F','text':'错误'}]
            answers=['T' if answer=='正确' else 'F']
        else:
            answers=list(answer)
            assert all(a in [o['key'] for o in options] for a in answers),(t,m.group(1),answer)
            assert len(answers)==1 if t=='single' else len(answers)>1
        n=int(m.group(1));qid=f'{t}-{n}'
        questions.append(dict(id=qid,type=t,number=n,title=title,options=options,answer=answers,explanation=clean(exp.group(1)),page=page,endPage=endpage,category=category(t,n,title),sourceNote=notes.get(qid,'')))
    assert [q['number'] for q in questions if q['type']==t]==list(range(1,len(starts)+1))
assert len(questions)==470
assert len({q['id'] for q in questions})==470
assert all(q['title'] and q['explanation'] for q in questions)
out=ROOT/'dist';out.mkdir(exist_ok=True)
data=dict(title='医疗陪诊顾问-题库202512',edition='2025.12',sourceFile=pdf.name,pageCount=len(doc),sourceSha256=hashlib.sha256(pdf.read_bytes()).hexdigest(),questions=questions)
(out/'questions.js').write_text('window.QUESTION_BANK = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'question-bank.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
import shutil
shutil.copyfile(pdf,out/'source.pdf')
report={'total':len(questions),'types':{t:sum(q['type']==t for q in questions) for t in types.values()},'options':{str(i):sum(len(q['options'])==i for q in questions) for i in (2,4,5)},'categories':{c:sum(q['category']==c for q in questions) for c in dict.fromkeys(q['category'] for q in questions)},'sourceNotes':notes}
(ROOT/'extraction-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))

"""Create a self-contained offline HTML with the source PDF embedded."""
from pathlib import Path
import base64, zipfile
root=Path(__file__).resolve().parent
dist=root/'dist'
html=(dist/'index.html').read_text(encoding='utf-8')
css=(dist/'styles.css').read_text(encoding='utf-8')
data=(dist/'questions.js').read_text(encoding='utf-8')
app=(dist/'app.js').read_text(encoding='utf-8')
pdf=base64.b64encode((dist/'source.pdf').read_bytes()).decode('ascii')
pdf_script="window.SOURCE_PDF_URL=URL.createObjectURL(new Blob([Uint8Array.from(atob('"+pdf+"'),c=>c.charCodeAt(0))],{type:'application/pdf'}));"
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
html=html.replace('<script src="questions.js"></script><script src="app.js"></script>','<script>'+data.replace('</script','<\\/script')+'</script><script>'+pdf_script+'</script><script>'+app.replace('</script','<\\/script')+'</script>')
(dist/'offline.html').write_text(html,encoding='utf-8')
(root.parent/'陪诊题库-离线版.html').write_text(html,encoding='utf-8')
with zipfile.ZipFile(root.parent/'陪诊题库-完整源码.zip','w',zipfile.ZIP_DEFLATED) as z:
    for file in root.rglob('*'):
        if file.is_file() and not any(p in ('.git','node_modules','qa','__pycache__') for p in file.relative_to(root).parts) and file.name not in ('.DS_Store',):
            z.write(file,Path('medical-study')/file.relative_to(root))
print('Offline HTML and source ZIP created.')

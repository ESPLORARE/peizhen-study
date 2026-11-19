"""Publish dist/ to the configured gh-pages branch without a custom Actions job."""
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
REMOTE = 'https://github.com/ESPLORARE/peizhen-study.git'

def git(*args, cwd, capture=False, check=True):
    return subprocess.run(['git', *args], cwd=cwd, check=check,
                          capture_output=capture, text=capture, encoding='utf-8' if capture else None)

if not (DIST / 'index.html').is_file():
    raise SystemExit('Missing dist/index.html.')
for name in ('app.js', 'questions.js'):
    subprocess.run(['node', '--check', str(DIST / name)], check=True)

with tempfile.TemporaryDirectory(prefix='peizhen-pages-') as temp:
    checkout = Path(temp).resolve() / 'website'
    git('clone', '--single-branch', '--branch', 'gh-pages', REMOTE, str(checkout), cwd=ROOT)
    # Remove only tracked publishing artifacts inside this disposable checkout.
    for relative in git('ls-files', '-z', cwd=checkout, capture=True).stdout.split('\0'):
        if not relative:
            continue
        target = checkout / relative
        target.resolve().relative_to(checkout.resolve())
        if target.is_symlink():
            raise SystemExit('Refusing an unexpected symlink in the publishing branch.')
        if target.is_file():
            target.unlink()
    for source in DIST.rglob('*'):
        if source.is_symlink():
            raise SystemExit('Publishing assets must not contain symlinks.')
    shutil.copytree(DIST, checkout, dirs_exist_ok=True)
    (checkout / '.nojekyll').touch()
    git('add', '--all', cwd=checkout)
    changed = git('diff', '--cached', '--quiet', cwd=checkout, check=False).returncode
    if changed == 0:
        print('Published files already match dist/. No push needed.')
    elif changed == 1:
        git('commit', '-m', 'Update published question bank', cwd=checkout)
        git('push', 'origin', 'gh-pages', cwd=checkout)
        print('Published branch updated. GitHub Pages will deploy it automatically.')
    else:
        raise SystemExit('Unable to inspect staged changes.')
print('Website: https://esplorare.github.io/peizhen-study/')

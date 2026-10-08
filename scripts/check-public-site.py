"""Validate indexable static pages, language pairs and newly added links.

Run: python scripts/check-public-site.py (requires beautifulsoup4).
Checks the whole public sitemap; pre-existing fragment issues are reported
separately unless they occur on a newly introduced service/reference page.
"""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://luminadigitale.com/'
NEW = ('referanslar', 'yazilim-gelistirme', 'otomasyon-bot-gelistirme', 'seo-geo-danismanligi')
errors, notes = [], set()
pages = {}
for path in ROOT.glob('*.html'):
    pages[path.name] = BeautifulSoup(path.read_text(encoding='utf-8-sig'), 'html.parser')

urls = [e.text for e in ET.parse(ROOT/'sitemap.xml').getroot().findall('{*}url/{*}loc')]
assert len(urls) == len(set(urls)), 'Duplicate sitemap URL'
public = []
for url in urls:
    name = unquote(urlsplit(url).path.lstrip('/')) or 'index.html'
    if not name.endswith('.html'):
        continue
    public.append(name)
    if name not in pages:
        errors.append(f'{name}: sitemap target missing'); continue
    soup = pages[name]
    robots = soup.find('meta', attrs={'name':'robots'})
    if robots and 'noindex' in robots.get('content',''):
        errors.append(f'{name}: noindex document in sitemap')
    canonical = soup.find('link', rel='canonical')
    if not canonical or canonical.get('href') != url:
        errors.append(f'{name}: canonical does not match sitemap URL')
    if len(soup.find_all('h1')) != 1:
        errors.append(f'{name}: expected exactly one h1')
    if not soup.title or not soup.title.get_text(strip=True): errors.append(f'{name}: no title')
    if not soup.find('meta',attrs={'name':'description'}): errors.append(f'{name}: no description')
    for script in soup.find_all('script', type='application/ld+json'):
        try: json.loads(script.string or script.get_text())
        except ValueError: errors.append(f'{name}: invalid JSON-LD')
    for alt in soup.select('link[hreflang]'):
        target = unquote(urlsplit(alt.get('href','')).path.lstrip('/')) or 'index.html'
        if target not in pages: errors.append(f'{name}: language target missing: {target}');continue
        reciprocal = [e.get('href') for e in pages[target].select('link[hreflang]')]
        if url not in reciprocal:errors.append(f'{name}: no reciprocal alternate from {target}')
    for node in soup.select('[href], [src]'):
        value = node.get('href') or node.get('src')
        parsed=urlsplit(value)
        if parsed.scheme or parsed.netloc or not parsed.path: continue
        target=(ROOT/unquote(parsed.path.lstrip('/'))).resolve()
        if not target.is_relative_to(ROOT.resolve()):errors.append(f'{name}: local link outside site');continue
        if not target.exists():errors.append(f'{name}: missing resource {parsed.path}')
        if parsed.fragment and target.name in pages and not pages[target.name].find(id=unquote(parsed.fragment)):
            message=f'{name}: fragment missing {value}'
            if name.startswith(NEW): errors.append(message)
            else: notes.add(message)
    if name.startswith(NEW):
        lang=soup.html.get('lang')
        wanted='en' if '-en.html' in name else 'tr'
        if lang != wanted:errors.append(f'{name}: wrong document language {lang}')
        if not soup.select_one('a[href="mailto:iletisim@luminadigitale.com"]'):errors.append(f'{name}: missing contact address')

for slug in NEW:
    for suffix in ('.html','-en.html'):
        name=slug+suffix
        if BASE+name not in urls:errors.append(f'{name}: new page missing from sitemap')
        links={a.get('hreflang') for a in pages[name].select('link[hreflang]')}
        if links != {'tr','en','x-default'}:errors.append(f'{name}: incomplete language alternates')

print(f'Checked {len(public)} sitemap HTML pages, {len(pages)} local documents.')
for note in sorted(notes):print('EXISTING FRAGMENT:',note)
for error in errors:print('FAIL:',error)
print('PASS' if not errors else f'FAILED: {len(errors)} issues')
raise SystemExit(bool(errors))

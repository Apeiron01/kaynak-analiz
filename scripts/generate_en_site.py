import copy
import json
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from bs4 import BeautifulSoup
from bs4.element import Comment
from deep_translator import GoogleTranslator

BASE_URL = "https://luminadigitale.com"
CACHE_PATH = Path("scripts/translation-cache-tr-en.json")
SKIP_FILES = {
    "google9a231a1a392c4e88.html",
}
SKIP_TEXT_TAGS = {"script", "style", "noscript"}
SKIP_JSON_KEYS = {
    "@context",
    "@type",
    "sameAs",
    "logo",
    "image",
    "identifier",
    "datePublished",
    "dateModified",
}
URL_JSON_KEYS = {"@id", "url", "contentUrl", "embedUrl", "mainEntityOfPage"}
TRANSLATABLE_META_NAMES = {
    "description",
    "keywords",
    "twitter:title",
    "twitter:description",
    "twitter:image:alt",
    "application-name",
    "apple-mobile-web-app-title",
}
TRANSLATABLE_META_PROPERTIES = {
    "og:title",
    "og:description",
    "og:site_name",
    "og:image:alt",
}
BRAND_TERMS = {
    "Lumina",
    "Etsy",
    "Shopify",
    "Meta Ads",
    "Google Ads",
    "ROAS",
    "SEO",
    "DNS",
    "QR",
    "TR",
    "EN",
}

translator = GoogleTranslator(source="tr", target="en")


def load_cache() -> dict[str, str]:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def page_url(filename: str, language: str = "tr") -> str:
    if filename == "index.html":
        if language == "tr":
            return f"{BASE_URL}/"
        return f"{BASE_URL}/index-en.html"

    stem = filename[:-5]
    if language == "en":
        return f"{BASE_URL}/{stem}-en.html"
    return f"{BASE_URL}/{filename}"


def is_external_href(href: str) -> bool:
    href_l = href.lower().strip()
    return (
        href_l.startswith("http://")
        or href_l.startswith("https://")
        or href_l.startswith("//")
        or href_l.startswith("mailto:")
        or href_l.startswith("tel:")
        or href_l.startswith("javascript:")
        or href_l.startswith("data:")
        or href_l.startswith("#")
    )


def to_en_href(href: str) -> str:
    href = href.strip()
    if not href or is_external_href(href):
        return href

    parts = urlsplit(href)
    path = parts.path

    if path in ("", "/"):
        path = "index-en.html"
    elif path.endswith(".html") and not path.endswith("-en.html"):
        path = path[:-5] + "-en.html"

    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def to_en_absolute(url: str) -> str:
    if not url:
        return url

    parsed = urlsplit(url)
    if parsed.netloc and parsed.netloc.lower() != "luminadigitale.com":
        return url

    path = parsed.path or "/"
    if path in ("", "/"):
        new_path = "/index-en.html"
    elif path.endswith(".html") and not path.endswith("-en.html"):
        new_path = path[:-5] + "-en.html"
    else:
        new_path = path

    scheme = parsed.scheme or "https"
    netloc = parsed.netloc or "luminadigitale.com"
    return urlunsplit((scheme, netloc, new_path, parsed.query, parsed.fragment))


def to_en_refresh_content(content: str) -> str:
    if not content:
        return content

    match = re.search(r"url\s*=\s*([^;]+)$", content, flags=re.IGNORECASE)
    if not match:
        return content

    current_url = match.group(1).strip()
    updated_url = to_en_href(current_url)
    if updated_url == current_url:
        return content

    return content[: match.start(1)] + updated_url + content[match.end(1) :]


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def should_translate(text: str) -> bool:
    raw = text or ""
    compact = normalize_whitespace(raw)
    if len(compact) < 2:
        return False
    if compact in BRAND_TERMS:
        return False
    if compact.lower().startswith(("http://", "https://", "www.")):
        return False
    if re.fullmatch(r"[\d\W_]+", compact):
        return False
    if not re.search(r"[A-Za-zÇĞİIÖŞÜçğıöşü]", compact):
        return False
    return True


def translate_with_cache(text: str, cache: dict[str, str], throttle: bool = True) -> str:
    compact = normalize_whitespace(text)
    if not should_translate(compact):
        return text

    if compact in cache:
        translated = cache[compact]
    else:
        translated = None
        for attempt in range(4):
            try:
                translated = translator.translate(compact)
                break
            except Exception:
                time.sleep(0.7 * (attempt + 1))

        if not translated:
            translated = compact

        cache[compact] = translated
        if throttle:
            time.sleep(0.03)

    leading = len(text) - len(text.lstrip())
    trailing = len(text) - len(text.rstrip())
    return (text[:leading] if leading else "") + translated + (text[len(text) - trailing :] if trailing else "")


def translate_json_like(value: Any, cache: dict[str, str], key_path: tuple[str, ...] = ()) -> Any:
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for key, nested in value.items():
            if key == "inLanguage" and isinstance(nested, str):
                out[key] = "en-US"
                continue
            if key in URL_JSON_KEYS and isinstance(nested, str):
                out[key] = to_en_absolute(nested)
                continue
            if key in SKIP_JSON_KEYS:
                out[key] = nested
                continue
            out[key] = translate_json_like(nested, cache, key_path + (key,))
        return out

    if isinstance(value, list):
        return [translate_json_like(item, cache, key_path) for item in value]

    if isinstance(value, str):
        if re.match(r"^https?://", value):
            return value
        if value.startswith("#"):
            return value
        return translate_with_cache(value, cache)

    return value


def update_hreflang(soup: BeautifulSoup, head: Any, tr_url: str, en_url: str) -> None:
    if head is None:
        return

    for link in list(head.find_all("link", attrs={"rel": "alternate"})):
        hreflang = (link.get("hreflang") or "").lower()
        if hreflang in {"tr", "en", "x-default"}:
            link.decompose()

    for hreflang, href in (("tr", tr_url), ("en", en_url), ("x-default", tr_url)):
        tag = soup.new_tag("link")
        tag["rel"] = "alternate"
        tag["hreflang"] = hreflang
        tag["href"] = href
        head.append(tag)


def apply_seo_tags(soup: BeautifulSoup, filename: str, language: str) -> None:
    html_tag = soup.find("html")
    if html_tag:
        html_tag["lang"] = "en" if language == "en" else "tr"

    head = soup.find("head")
    if head is None:
        return

    tr_url = page_url(filename, "tr")
    en_url = page_url(filename, "en")

    canonical = head.find("link", attrs={"rel": "canonical"})
    canonical_href = en_url if language == "en" else tr_url
    if canonical:
        canonical["href"] = canonical_href
    else:
        tag = soup.new_tag("link")
        tag["rel"] = "canonical"
        tag["href"] = canonical_href
        head.append(tag)

    og_url = head.find("meta", attrs={"property": "og:url"})
    if og_url:
        og_url["content"] = canonical_href

    og_locale = head.find("meta", attrs={"property": "og:locale"})
    if og_locale:
        og_locale["content"] = "en_US" if language == "en" else "tr_TR"

    update_hreflang(soup, head, tr_url, en_url)


def translate_soup(soup: BeautifulSoup, cache: dict[str, str]) -> None:
    for text_node in list(soup.find_all(string=True)):
        if isinstance(text_node, Comment):
            continue
        parent = text_node.parent
        if parent is None:
            continue
        if parent.name in SKIP_TEXT_TAGS:
            continue
        original = str(text_node)
        translated = translate_with_cache(original, cache)
        if translated != original:
            text_node.replace_with(translated)

    for tag in soup.find_all(True):
        for attr in ("title", "aria-label", "placeholder"):
            if tag.has_attr(attr):
                tag[attr] = translate_with_cache(tag[attr], cache)

        if tag.has_attr("alt") and tag.get("alt", "").strip():
            tag["alt"] = translate_with_cache(tag["alt"], cache)

        if tag.has_attr("value") and tag.name in {"input", "button", "option"}:
            value = tag.get("value", "")
            if should_translate(value):
                tag["value"] = translate_with_cache(value, cache)

        if tag.name == "meta":
            name = (tag.get("name") or "").lower()
            prop = (tag.get("property") or "").lower()
            if name in TRANSLATABLE_META_NAMES or prop in TRANSLATABLE_META_PROPERTIES:
                content = tag.get("content")
                if content:
                    tag["content"] = translate_with_cache(content, cache)
            if (tag.get("http-equiv") or "").lower() == "refresh" and tag.get("content"):
                tag["content"] = to_en_refresh_content(tag["content"])

        if tag.name == "a" and tag.has_attr("href"):
            tag["href"] = to_en_href(tag["href"])

        if tag.name == "link" and tag.get("rel") == ["canonical"] and tag.has_attr("href"):
            tag["href"] = to_en_absolute(tag["href"])

        if tag.name == "meta" and (tag.get("property") or "").lower() == "og:url" and tag.get("content"):
            tag["content"] = to_en_absolute(tag["content"])

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except Exception:
            continue

        translated_payload = translate_json_like(payload, cache)
        script.string = json.dumps(translated_payload, ensure_ascii=False, indent=2)


def write_en_version(filename: str, cache: dict[str, str]) -> None:
    source_path = Path(filename)
    html_text = source_path.read_text(encoding="utf-8")
    soup_tr = BeautifulSoup(html_text, "html.parser")

    soup_en = copy.deepcopy(soup_tr)
    translate_soup(soup_en, cache)
    apply_seo_tags(soup_en, filename, "en")

    target_path = source_path.with_name(source_path.stem + "-en.html")
    target_path.write_text(str(soup_en), encoding="utf-8", newline="\r\n")


def refresh_sitemap() -> None:
    sitemap_path = Path("sitemap.xml")
    if not sitemap_path.exists():
        return

    content = sitemap_path.read_text(encoding="utf-8")
    locs = re.findall(r"<loc>(.*?)</loc>", content)
    extra = []
    for loc in locs:
        if not loc.endswith(".html"):
            continue
        if loc.endswith("-en.html"):
            continue
        if "/llms" in loc:
            continue
        if loc.endswith("/google9a231a1a392c4e88.html"):
            continue
        extra.append(loc[:-5] + "-en.html")
    if f"{BASE_URL}/" in locs:
        extra.append(f"{BASE_URL}/index-en.html")

    all_locs = []
    seen = set()
    for loc in locs + extra:
        if loc in seen:
            continue
        seen.add(loc)
        all_locs.append(loc)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc in all_locs:
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append("  </url>")
    lines.append("</urlset>")
    sitemap_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    cache = load_cache()

    html_files = [
        path.name
        for path in Path(".").glob("*.html")
        if not path.name.endswith("-en.html") and path.name not in SKIP_FILES
    ]
    html_files.sort()

    for idx, filename in enumerate(html_files, 1):
        print(f"[{idx}/{len(html_files)}] {filename}")
        write_en_version(filename, cache)
        if idx % 3 == 0:
            save_cache(cache)

    save_cache(cache)
    refresh_sitemap()
    print("Done.")


if __name__ == "__main__":
    main()

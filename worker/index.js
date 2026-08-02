const SITE_ORIGIN = 'https://stories.asfar.family';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/social/wisdom-short-stories-og.png`;

export const SOCIAL_METADATA = Object.freeze({
  '/': {
    title: 'Wisdom Short Stories',
    description: 'Timeless tales retold as short trilingual cinematic experiences in English, Chinese, and Indonesian.',
    canonicalPath: '/',
    type: 'website',
  },
  '/stories/smell-of-soup': {
    title: 'The Smell of Soup & The Sound of Money | Wisdom Short Stories',
    description: 'A hungry traveler, a disputed aroma, and Nasreddin Hodja’s perfectly measured judgment—cinematically told in English, Chinese, and Indonesian.',
    canonicalPath: '/stories/smell-of-soup/',
    type: 'article',
  },
  '/stories/yan-er-dao-ling': {
    title: '掩耳盗铃 — Covering One’s Ears While Stealing a Bell | Wisdom Short Stories',
    description: 'An ancient Chinese fable about a thief, a bronze bell, and a silence that fools only him—cinematically told in Chinese, English, and Indonesian.',
    canonicalPath: '/stories/yan-er-dao-ling/',
    type: 'article',
  },
});

function normalizePath(pathname) {
  const withoutIndex = pathname.replace(/\/index\.html$/, '');
  return withoutIndex.replace(/\/+$/, '') || '/';
}

export function metadataForPath(pathname) {
  const metadata = SOCIAL_METADATA[normalizePath(pathname)] ?? SOCIAL_METADATA['/'];
  return {
    ...metadata,
    canonical: `${SITE_ORIGIN}${metadata.canonicalPath}`,
    image: SOCIAL_IMAGE,
  };
}

class TextHandler {
  constructor(value) {
    this.value = value;
  }

  element(element) {
    element.setInnerContent(this.value);
  }
}

class AttributeHandler {
  constructor(attribute, value) {
    this.attribute = attribute;
    this.value = value;
  }

  element(element) {
    element.setAttribute(this.attribute, this.value);
  }
}

function rewriteMetadata(response, metadata) {
  return new HTMLRewriter()
    .on('title', new TextHandler(metadata.title))
    .on('meta[name="description"]', new AttributeHandler('content', metadata.description))
    .on('link[rel="canonical"]', new AttributeHandler('href', metadata.canonical))
    .on('meta[property="og:title"]', new AttributeHandler('content', metadata.title))
    .on('meta[property="og:description"]', new AttributeHandler('content', metadata.description))
    .on('meta[property="og:type"]', new AttributeHandler('content', metadata.type))
    .on('meta[property="og:url"]', new AttributeHandler('content', metadata.canonical))
    .on('meta[property="og:image"]', new AttributeHandler('content', metadata.image))
    .on('meta[name="twitter:title"]', new AttributeHandler('content', metadata.title))
    .on('meta[name="twitter:description"]', new AttributeHandler('content', metadata.description))
    .on('meta[name="twitter:image"]', new AttributeHandler('content', metadata.image))
    .transform(response);
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('text/html')) return response;

    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Content-Type-Options', 'nosniff');

    const htmlResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

    return rewriteMetadata(htmlResponse, metadataForPath(new URL(request.url).pathname));
  },
};

const SITE_ORIGIN = 'https://stories.asfar.family';
const SOCIAL_IMAGE = `${SITE_ORIGIN}/social/wisdom-short-stories-og.png`;
const INDEX_ROBOTS = 'index, follow, max-image-preview:large';
const NOT_FOUND_METADATA = Object.freeze({
  title: 'Story Not Found | Wisdom Short Stories',
  description: 'This story is not on the shelf. Browse Wisdom Short Stories for cinematic folktales in English, Chinese, and Indonesian.',
  type: 'website',
});

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
  '/stories/tiger-and-dried-persimmon': {
    title: 'The Tiger and the Dried Persimmon | Wisdom Short Stories',
    description: 'A classic Korean folktale about a crying child, a cattle thief, and the tiny dried persimmon that sends a tiger running—cinematically told in English, Chinese, and Indonesian.',
    canonicalPath: '/stories/tiger-and-dried-persimmon/',
    type: 'article',
  },
  '/stories/anansi-and-the-pot': {
    title: 'Anansi and the Pot | Wisdom Short Stories',
    description: 'An Akan Anansesem about Kwaku Ananse, a gourd filled with wisdom, and the small child whose simple idea reveals what the trickster missed—cinematically told in English, Chinese, and Indonesian.',
    canonicalPath: '/stories/anansi-and-the-pot/',
    type: 'article',
  },
});

function normalizePath(pathname) {
  const withoutIndex = pathname.replace(/\/index\.html$/, '');
  return withoutIndex.replace(/\/+$/, '') || '/';
}

export function metadataForPath(pathname) {
  const path = normalizePath(pathname);
  const registered = SOCIAL_METADATA[path];
  const metadata = registered ?? {
    ...NOT_FOUND_METADATA,
    canonicalPath: path === '/' ? '/' : `${path}/`,
  };
  return {
    ...metadata,
    canonical: `${SITE_ORIGIN}${metadata.canonicalPath}`,
    image: SOCIAL_IMAGE,
    robots: registered ? INDEX_ROBOTS : 'noindex, follow',
    status: registered ? 200 : 404,
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
    .on('meta[name="robots"]', new AttributeHandler('content', metadata.robots))
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
    const metadata = metadataForPath(new URL(request.url).pathname);
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('text/html')) return response;

    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Content-Type-Options', 'nosniff');

    const htmlResponse = new Response(response.body, {
      status: metadata.status,
      headers,
    });

    if (request.method === 'HEAD') {
      return new Response(null, { status: metadata.status, headers });
    }
    return rewriteMetadata(htmlResponse, metadata);
  },
};

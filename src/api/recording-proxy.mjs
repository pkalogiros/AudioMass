function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Range, Accept-Ranges'
  };
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function copyHeader(source, target, name) {
  const value = source.headers.get(name);

  if (value) {
    target.set(name, value);
  }
}

async function proxyRecording(request) {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get('url') || '';
  let targetUrl;

  try {
    targetUrl = new URL(rawUrl);
  } catch (err) {
    return jsonResponse({ error: 'Missing or invalid url' }, 400);
  }

  if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
    return jsonResponse({ error: 'URL is not allowed' }, 403);
  }

  const headers = new Headers();

  if (request.headers.get('range')) {
    headers.set('Range', request.headers.get('range'));
  }

  try {
    const upstream = await fetch(targetUrl.href, {
      method: request.method === 'HEAD' ? 'GET' : request.method,
      headers,
      redirect: 'follow'
    });

    const responseHeaders = new Headers(corsHeaders());
    responseHeaders.set('Cache-Control', 'no-store');

    copyHeader(upstream, responseHeaders, 'content-type');
    copyHeader(upstream, responseHeaders, 'content-length');
    copyHeader(upstream, responseHeaders, 'content-range');
    copyHeader(upstream, responseHeaders, 'accept-ranges');
    copyHeader(upstream, responseHeaders, 'content-disposition');

    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch (err) {
    return jsonResponse({ error: 'Could not fetch recording' }, 502);
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export function GET(request) {
  return proxyRecording(request);
}

export function HEAD(request) {
  return proxyRecording(request);
}

/**
 * Minimal HTTP router for the Node.js HTTP server.
 * Avoids the need for Express while giving clean route/middleware separation.
 */

/**
 * @typedef {Object} Route
 * @property {string} method  - HTTP method (GET, POST, …)
 * @property {string} path    - Exact normalised path
 * @property {Function[]} handlers - Middleware chain
 */

/**
 * Creates a lightweight router that works with Node's http.IncomingMessage /
 * http.ServerResponse pair.
 */
export function createRouter() {
  /** @type {Route[]} */
  const routes = [];
  /** @type {Function[]} */
  const globalMiddleware = [];

  /**
   * Collect the JSON body from a request stream.
   * @param {import('http').IncomingMessage} req
   * @returns {Promise<string>}
   */
  function collectBody(req) {
    return new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk.toString();
      });
      req.on('end', () => resolve(raw));
      req.on('error', reject);
    });
  }

  /**
   * Parse and attach `req.body` for POST/PUT/PATCH requests.
   * Attaches `req.body = {}` on parse failure or non-JSON content-type.
   */
  async function parseBody(req) {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    if (!hasBody) {
      req.body = {};
      return;
    }
    try {
      const raw = await collectBody(req);
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
  }

  /**
   * Normalises a URL to just its path (strips query string, collapses double
   * slashes, removes trailing slash).
   */
  function normalisePath(url) {
    const raw = url.split('?')[0];
    return raw.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
  }

  return {
    /** Register global middleware (runs before every route). */
    use(fn) {
      globalMiddleware.push(fn);
    },

    /** Register a route handler. */
    route(method, path, ...handlers) {
      routes.push({ method: method.toUpperCase(), path, handlers });
    },

    get(path, ...handlers) {
      this.route('GET', path, ...handlers);
    },
    post(path, ...handlers) {
      this.route('POST', path, ...handlers);
    },
    put(path, ...handlers) {
      this.route('PUT', path, ...handlers);
    },
    delete(path, ...handlers) {
      this.route('DELETE', path, ...handlers);
    },

    /**
     * The main request handler — attach this to http.createServer().
     */
    async handle(req, res) {
      // Helper to send JSON responses
      res.json = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      };

      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Parse body once
      await parseBody(req);

      const path = normalisePath(req.url);

      // Find matching route
      const match = routes.find(
        (r) => r.method === req.method && (r.path === path || path.endsWith(r.path)),
      );

      if (!match) {
        res.json(404, { error: 'Not Found' });
        return;
      }

      // Build middleware chain: globals + route handlers
      const chain = [...globalMiddleware, ...match.handlers];
      let idx = 0;

      function next(err) {
        if (err) {
          res.json(500, { error: err.message || 'Internal Server Error' });
          return;
        }
        const fn = chain[idx++];
        if (!fn) return; // exhausted
        try {
          Promise.resolve(fn(req, res, next)).catch((e) => {
            res.json(500, { error: e.message || 'Internal Server Error' });
          });
        } catch (e) {
          res.json(500, { error: e.message || 'Internal Server Error' });
        }
      }

      next();
    },
  };
}

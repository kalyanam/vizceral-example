// Synthetic on-prem topology: 2 regions x 2 DCs, 20 apps, each with its own deterministic service flow.

export const REGIONS = [
  { name: 'east', displayName: 'EAST', dcs: ['east-dc1', 'east-dc2'] },
  { name: 'west', displayName: 'WEST', dcs: ['west-dc3', 'west-dc4'] }
];
export const DCS = REGIONS.flatMap(region => region.dcs.map(dc => ({ name: dc, region: region.name })));

const APP_DEFS = [
  ['www.acme.com', '4dc'],
  ['api.acme.com', '4dc'],
  ['login.acme.com', '4dc'],
  ['search.acme.com', '4dc'],
  ['checkout.acme.com', '4dc'],
  ['cart.acme.com', '4dc'],
  ['catalog.acme.com', '4dc'],
  ['payments.acme.com', '4dc'],
  ['media.acme.com', '4dc'],
  ['notify.acme.com', '4dc'],
  ['partners.acme.com', '2region-standby'],
  ['vendor-portal.acme.com', '2region-active'],
  ['billing.acme.internal', '2region-standby'],
  ['ledger.acme.internal', '2region-active'],
  ['claims.acme.internal', '2region-standby'],
  ['inventory.acme.internal', '2region-active'],
  ['reports.acme.internal', '2region-standby'],
  ['hr.acme.internal', '2region-active'],
  ['payroll.acme.internal', '2region-standby'],
  ['tickets.acme.internal', '2region-active']
];

const SERVICE_POOL = [
  'orders', 'profile', 'pricing', 'risk', 'session', 'token', 'render', 'export', 'audit', 'quota',
  'geo', 'rules', 'workflow', 'scheduler', 'reco', 'index', 'ingest', 'ledger', 'fraud', 'tax',
  'shipping', 'promo', 'review', 'image', 'thumbs', 'feed', 'consent', 'policy', 'invoice', 'reconcile'
];
const SHARED_SERVICES = ['sso-auth', 'ldap', 'kafka', 'redis', 'oracle-rac', 'postgres', 'elastic', 'mq'];
const STORAGE = new Set(['kafka', 'redis', 'oracle-rac', 'postgres', 'elastic', 'mq']);

function hashString (str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom (seed) {
  let a = typeof seed === 'number' ? seed : hashString(seed);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rand, lo, hi) => lo + (rand() * (hi - lo));
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
function sample (rand, list, count) {
  const pool = list.slice();
  const out = [];
  while (out.length < count && pool.length) { out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]); }
  return out;
}

function buildApp (fqdn, mode) {
  const rand = seededRandom(fqdn);
  const prefix = fqdn.split('.')[0];
  const isInternal = fqdn.endsWith('.internal');
  const errorRate = rand() < 0.15 ? between(rand, 0.02, 0.05) : between(rand, 0.0005, 0.008);
  const rps = mode === '4dc' ? between(rand, 2500, 18000) : between(rand, 150, 2500);

  // 4dc: active in every DC, any DC can fail over to the other three.
  // 2region-active: active in both DCs of each region, failover happens a whole region at a time.
  // 2region-standby: active in one DC per region, the other DC in the region is a warm standby.
  const dcShare = {};
  const standbyDcs = [];
  if (mode === '4dc') {
    const weights = DCS.map(() => between(rand, 0.8, 1.2));
    const total = weights.reduce((a, b) => a + b, 0);
    DCS.forEach((dc, i) => { dcShare[dc.name] = weights[i] / total; });
  } else if (mode === '2region-active') {
    const eastShare = between(rand, 0.35, 0.65);
    REGIONS.forEach((region, i) => {
      const regionShare = i === 0 ? eastShare : 1 - eastShare;
      const split = between(rand, 0.45, 0.55);
      dcShare[region.dcs[0]] = regionShare * split;
      dcShare[region.dcs[1]] = regionShare * (1 - split);
    });
  } else {
    REGIONS.forEach((region) => {
      const active = pick(rand, region.dcs);
      region.dcs.forEach((dc) => {
        dcShare[dc] = dc === active ? between(rand, 0.4, 0.6) : 0;
        if (dc !== active) { standbyDcs.push(dc); }
      });
    });
    const total = Object.values(dcShare).reduce((a, b) => a + b, 0);
    Object.keys(dcShare).forEach((dc) => { dcShare[dc] /= total; });
  }

  // Service flow: lb -> [web] -> gw -> services -> deeper services / shared platform / app db.
  const names = {
    lb: `${prefix}-lb`, web: `${prefix}-web`, gw: `${prefix}-gw`, db: `${prefix}-db`
  };
  const services = sample(rand, SERVICE_POOL, 3 + Math.floor(rand() * 5)).map(s => `${prefix}-${s}`);
  const shared = ['sso-auth', ...sample(rand, SHARED_SERVICES.slice(1), 2 + Math.floor(rand() * 3))];
  const edges = [];
  const add = (source, target, fraction) => edges.push({ source, target, fraction });

  add('INTERNET', names.lb, 1);
  const hasWeb = !prefix.startsWith('api') && rand() < 0.85;
  const entry = hasWeb ? names.web : names.gw;
  add(names.lb, entry, 1);
  if (hasWeb) {
    add(names.web, names.gw, between(rand, 0.7, 0.95));
    add(names.web, 'sso-auth', between(rand, 0.05, 0.2));
  } else {
    add(names.gw, 'sso-auth', between(rand, 0.1, 0.3));
  }
  const gwWeights = services.map(() => rand());
  const gwTotal = gwWeights.reduce((a, b) => a + b, 0);
  const serviceVolume = {};
  services.forEach((svc, i) => {
    serviceVolume[svc] = (gwWeights[i] / gwTotal) * 0.9;
    add(names.gw, svc, serviceVolume[svc]);
  });
  services.forEach((svc, i) => {
    const vol = serviceVolume[svc];
    const downstream = services.slice(i + 1);
    if (downstream.length && rand() < 0.6) { add(svc, pick(rand, downstream), vol * between(rand, 0.2, 0.6)); }
    add(svc, rand() < 0.6 ? names.db : pick(rand, shared.slice(1)), vol * between(rand, 0.3, 0.9));
    if (rand() < 0.4) { add(svc, pick(rand, shared.slice(1)), vol * between(rand, 0.1, 0.4)); }
  });
  if (!edges.some(e => e.target === names.db)) { add(services[0], names.db, serviceVolume[services[0]] * 0.5); }

  return {
    fqdn, prefix, mode, isInternal, rps, errorRate, dcShare, standbyDcs, edges,
    dcs: Object.keys(dcShare).filter(dc => dcShare[dc] > 0),
    nodeNames: [...new Set(edges.flatMap(e => [e.source, e.target]))]
  };
}

export const APPS = APP_DEFS.map(([fqdn, mode]) => buildApp(fqdn, mode));
export const APPS_BY_FQDN = Object.fromEntries(APPS.map(app => [app.fqdn, app]));

function metrics (volume, errorRate, jitter) {
  const total = volume * jitter();
  return { normal: total * (1 - errorRate), danger: total * errorRate * 0.9, warning: total * errorRate * 0.1 };
}

const volumeOf = m => m.normal + m.danger + m.warning;
const nodeClass = errorRate => (errorRate >= 0.02 ? 'danger' : errorRate >= 0.01 ? 'warning' : 'normal');

function serviceNode (name, dc, volume, rand) {
  const instances = name === 'INTERNET' ? 0 : 2 + Math.floor(rand() * 4);
  const node = { name, renderer: 'focusedChild', metadata: {} };
  if (STORAGE.has(name) || name.endsWith('-db')) { node.node_type = 'storage'; }
  if (instances) {
    node.nodes = Array.from({ length: instances }, (_, i) => ({
      name: `${dc}-${name}-${String(i + 1).padStart(2, '0')}`,
      metrics: { normal: volume / instances, danger: 0 }
    }));
  }
  return node;
}

function maxVolume (connections) {
  return connections.reduce((acc, c) => Math.max(acc, volumeOf(c.metrics)), 0);
}

function appGraphForDc (app, dc, jitter) {
  const dcRps = app.rps * app.dcShare[dc];
  const isStandby = app.standbyDcs.includes(dc);
  // Standby DCs only see health checks.
  const scale = isStandby ? 0.5 : dcRps;
  const rand = seededRandom(`${app.fqdn}:${dc}`);
  const connections = app.edges.map(e => ({
    source: e.source, target: e.target, metrics: metrics(scale * e.fraction, app.errorRate, jitter)
  }));
  const inbound = {};
  connections.forEach((c) => { inbound[c.target] = (inbound[c.target] || 0) + volumeOf(c.metrics); });
  const nodes = app.nodeNames.map((name) => {
    const node = serviceNode(name, dc, inbound[name] || 0, rand);
    if (isStandby && name === `${app.prefix}-lb`) {
      node.notices = [{ title: 'Warm standby: health checks only', severity: 1 }];
    }
    return node;
  });
  return { nodes, connections, isStandby, dcRps: isStandby ? 0 : dcRps };
}

function aggregateGraphForDc (dc, jitter) {
  const rand = seededRandom(`aggregate:${dc}`);
  const totals = {};
  const addVolume = (source, target, m) => {
    const key = `${source}\u0000${target}`;
    const t = totals[key] || (totals[key] = { source, target, metrics: { normal: 0, danger: 0, warning: 0 } });
    t.metrics.normal += m.normal; t.metrics.danger += m.danger; t.metrics.warning += m.warning;
  };
  const appNodes = [];
  APPS.forEach((app) => {
    const graph = appGraphForDc(app, dc, jitter);
    if (graph.isStandby) { return; }
    const lbEdge = graph.connections.find(c => c.source === 'INTERNET');
    addVolume('INTERNET', 'f5-ltm', lbEdge.metrics);
    addVolume('f5-ltm', app.fqdn, lbEdge.metrics);
    graph.connections
      .filter(c => SHARED_SERVICES.includes(c.target))
      .forEach(c => addVolume(app.fqdn, c.target, c.metrics));
    const node = serviceNode(app.fqdn, dc, volumeOf(lbEdge.metrics), rand);
    node.metadata = { fqdn: app.fqdn };
    node.class = nodeClass(app.errorRate);
    appNodes.push(node);
  });
  const connections = Object.values(totals);
  const sharedUsed = [...new Set(connections.map(c => c.target).filter(t => SHARED_SERVICES.includes(t)))];
  const nodes = [
    { name: 'INTERNET' },
    serviceNode('f5-ltm', dc, 0, rand),
    ...appNodes,
    ...sharedUsed.map(name => serviceNode(name, dc, 0, rand))
  ];
  return { nodes, connections };
}

/**
 * Build Vizceral traffic for the on-prem topology.
 * @param {string} [fqdn] Limit traffic to one app; omit for the aggregate of all apps.
 * @param {number} [now] Timestamp used for the update status and the jitter between refreshes.
 */
export function buildOnPremTraffic (fqdn, now = Date.now()) {
  const app = fqdn ? APPS_BY_FQDN[fqdn] : undefined;
  const jitterRand = seededRandom(Math.floor(now / 1000));
  const jitter = () => between(jitterRand, 0.95, 1.05);

  const dcNodes = DCS.map(({ name: dc, region }) => {
    const graph = app ? appGraphForDc(app, dc, jitter) : aggregateGraphForDc(dc, jitter);
    const isStandby = Boolean(app && graph.isStandby);
    return {
      renderer: 'region',
      layout: 'ltrTree',
      name: dc,
      displayName: dc.toUpperCase(),
      updated: now,
      maxVolume: maxVolume(graph.connections) * 1.5,
      class: app ? nodeClass(app.errorRate) : 'normal',
      metadata: { region, standby: isStandby },
      notices: isStandby ? [{ title: `Warm standby for ${app.fqdn}`, severity: 1 }] : [],
      nodes: graph.nodes,
      connections: graph.connections
    };
  });

  const connections = [];
  dcNodes.forEach((node) => {
    const ingress = node.connections.filter(c => c.source === 'INTERNET')
      .reduce((acc, c) => {
        acc.normal += c.metrics.normal; acc.danger += c.metrics.danger; acc.warning += c.metrics.warning;
        return acc;
      }, { normal: 0, danger: 0, warning: 0 });
    const volume = node.metadata.standby ? 0 : volumeOf(ingress);
    connections.push({
      source: 'INTERNET',
      target: node.name,
      metrics: node.metadata.standby ? { normal: 0, danger: 0, warning: 0 } : ingress,
      class: 'normal'
    });
    node.metadata.ingress = volume;
  });
  // Intra-region replication links make the DC pairs read as regions.
  REGIONS.forEach(({ dcs: [a, b] }) => {
    const nodeA = dcNodes.find(n => n.name === a);
    const nodeB = dcNodes.find(n => n.name === b);
    const replicate = (from, to) => {
      const volume = from.metadata.ingress * 0.04;
      if (volume > 0) { connections.push({ source: from.name, target: to.name, metrics: { normal: volume, danger: 0, warning: 0 }, class: 'normal' }); }
    };
    replicate(nodeA, nodeB);
    replicate(nodeB, nodeA);
  });

  return {
    renderer: 'global',
    name: 'onprem',
    serverUpdateTime: now,
    nodes: [{ renderer: 'region', name: 'INTERNET', displayName: 'INTERNET', nodes: [], connections: [], metadata: {}, class: 'normal' }, ...dcNodes],
    connections
  };
}

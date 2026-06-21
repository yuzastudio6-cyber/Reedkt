import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const scanTargets = [
  { key: 'activeMigrations', dir: 'supabase/migrations' },
  { key: 'draftMigrations', dir: 'database/migration-drafts' },
  { key: 'testSql', dir: 'database/test-sql' },
];

const dangerousTerms = [
  'service_role_key',
  'SUPABASE_SERVICE_ROLE_KEY',
  'api_key',
  'secret',
  'signed_url',
  'password',
  'token',
];

const patterns = {
  createTables: /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:(public|storage)\.)?([a-zA-Z_][\w]*)/gi,
  createTypes: /\bcreate\s+type\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z_][\w]*)/gi,
  createFunctions: /\bcreate\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-zA-Z_][\w]*)/gi,
  createPolicies: /\bcreate\s+policy\s+("([^"]+)"|([a-zA-Z_][\w]*))/gi,
  createIndexes: /\bcreate\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-zA-Z_][\w]*)/gi,
  createViews: /\bcreate\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-zA-Z_][\w]*)/gi,
  createTriggers: /\bcreate\s+trigger\s+([a-zA-Z_][\w]*)/gi,
  enableRls: /\balter\s+table\s+(?:if\s+exists\s+)?(?:(public|storage)\.)?([a-zA-Z_][\w]*)\s+enable\s+row\s+level\s+security\b/gi,
  storageBucketInserts: /\binsert\s+into\s+storage\.buckets\b/gi,
  todoFixme: /\b(TODO|FIXME)\b/gi,
};

const dangerousRegex = new RegExp(`\\b(${dangerousTerms.join('|')})\\b`, 'gi');
const signedUrlRegex = /\bsigned[_\s-]?url(s)?\b/gi;

function listSqlFiles(dir) {
  const absoluteDir = path.join(root, dir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  return fs
    .readdirSync(absoluteDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => path.join(dir, name));
}

function collectMatches(sql, regex, mapper) {
  const matches = [];
  regex.lastIndex = 0;
  for (const match of sql.matchAll(regex)) {
    matches.push(mapper(match));
  }
  return matches;
}

function lineForOffset(sql, offset) {
  return sql.slice(0, offset).split('\n').length;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function countBy(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function duplicateEntries(values) {
  return Object.entries(countBy(values))
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function auditFile(filePath) {
  const absolutePath = path.join(root, filePath);
  const sql = fs.readFileSync(absolutePath, 'utf8');
  const lines = sql.split('\n');

  const createTables = collectMatches(sql, patterns.createTables, (match) => ({
    schema: match[1] ?? 'public',
    name: match[2],
  }));
  const createTypes = collectMatches(sql, patterns.createTypes, (match) => match[1]);
  const createFunctions = collectMatches(sql, patterns.createFunctions, (match) => match[1]);
  const createPolicies = collectMatches(sql, patterns.createPolicies, (match) => match[2] ?? match[3]);
  const createIndexes = collectMatches(sql, patterns.createIndexes, (match) => match[1]);
  const createViews = collectMatches(sql, patterns.createViews, (match) => match[1]);
  const createTriggers = collectMatches(sql, patterns.createTriggers, (match) => match[1]);
  const enableRls = collectMatches(sql, patterns.enableRls, (match) => ({
    schema: match[1] ?? 'public',
    table: match[2],
  }));
  const storageBucketInsertCount = (sql.match(patterns.storageBucketInserts) ?? []).length;
  const todoFixme = collectMatches(sql, patterns.todoFixme, (match) => ({
    line: lineForOffset(sql, match.index ?? 0),
    marker: match[1].toUpperCase(),
  }));

  const dangerousReferences = [];
  lines.forEach((line, index) => {
    dangerousRegex.lastIndex = 0;
    const terms = [...line.matchAll(dangerousRegex)].map((match) => match[1]);
    if (terms.length > 0) {
      dangerousReferences.push({
        line: index + 1,
        terms: uniqueSorted(terms.map((term) => term.toLowerCase())),
      });
    }
  });

  const signedUrlReferences = [];
  lines.forEach((line, index) => {
    signedUrlRegex.lastIndex = 0;
    const matches = [...line.matchAll(signedUrlRegex)];
    if (matches.length > 0) {
      signedUrlReferences.push({
        line: index + 1,
        count: matches.length,
      });
    }
  });

  return {
    path: filePath,
    counts: {
      createTables: createTables.length,
      createTypes: createTypes.length,
      createFunctions: createFunctions.length,
      createPolicies: createPolicies.length,
      createIndexes: createIndexes.length,
      createViews: createViews.length,
      createTriggers: createTriggers.length,
      enableRls: enableRls.length,
      storageBucketInserts: storageBucketInsertCount,
      dangerousReferences: dangerousReferences.length,
      signedUrlReferences: signedUrlReferences.length,
      todoFixme: todoFixme.length,
    },
    creates: {
      tables: createTables.map((entry) => `${entry.schema}.${entry.name}`),
      types: createTypes,
      functions: createFunctions,
      policies: createPolicies,
      indexes: createIndexes,
      views: createViews,
      triggers: createTriggers,
      rlsTables: enableRls.map((entry) => `${entry.schema}.${entry.table}`),
    },
    dangerousReferences,
    signedUrlReferences,
    todoFixme,
  };
}

function sumCounts(fileAudits) {
  const totals = {};
  for (const audit of fileAudits) {
    for (const [key, value] of Object.entries(audit.counts)) {
      totals[key] = (totals[key] ?? 0) + value;
    }
  }
  return totals;
}

function auditGroup(target) {
  const files = listSqlFiles(target.dir);
  const fileAudits = files.map(auditFile);
  const tableNames = fileAudits.flatMap((audit) => audit.creates.tables.map((name) => name.replace(/^public\./, '')));
  const typeNames = fileAudits.flatMap((audit) => audit.creates.types);
  const functionNames = fileAudits.flatMap((audit) => audit.creates.functions);

  return {
    key: target.key,
    directory: target.dir,
    fileCount: files.length,
    files: fileAudits,
    totals: sumCounts(fileAudits),
    potentialDuplicates: {
      tables: duplicateEntries(tableNames),
      types: duplicateEntries(typeNames),
      functions: duplicateEntries(functionNames),
    },
  };
}

const groups = Object.fromEntries(scanTargets.map((target) => [target.key, auditGroup(target)]));

const summary = {
  generatedAt: new Date().toISOString(),
  repoRelativeRoot: '.',
  safety: {
    connectsToSupabase: false,
    readsEnvironmentSecrets: false,
    executesSql: false,
    usesNodeBuiltInsOnly: true,
  },
  groups,
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

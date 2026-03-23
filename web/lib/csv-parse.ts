/**
 * Divide o texto em linhas lógicas de CSV (quebras de linha **dentro** de "..." não contam).
 */
function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let cur = '';
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (inQuotes && s[i + 1] === '"') {
        cur += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        cur += c;
      }
    } else if (!inQuotes && (c === '\n' || (c === '\r' && s[i + 1] === '\n'))) {
      if (c === '\r') i++;
      rows.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  rows.push(cur);
  return rows.filter((r) => r.trim().length > 0);
}

function parseCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  const d = delimiter;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === d) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function detectDelimiter(headerLine: string): ',' | ';' {
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  for (let i = 0; i < headerLine.length; i++) {
    const c = headerLine[i];
    if (c === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes) {
      if (c === ',') commas++;
      if (c === ';') semicolons++;
    }
  }
  return semicolons > commas ? ';' : ',';
}

export function parseCsvRecords(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = splitCsvRows(text);
  if (lines.length < 2) {
    throw new Error('O CSV precisa de cabeçalho e pelo menos uma linha de dados.');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = parseCsvLine(lines[0], delimiter);
  const headers = headerCells.map((h) => h.trim().toLowerCase());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = (cols[j] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

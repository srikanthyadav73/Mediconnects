/**
 * Utility to generate and trigger client-side CSV downloads adhering to RFC 4180
 */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const escapeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  const csvContent = `${headerRow}\n${dataRows}`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


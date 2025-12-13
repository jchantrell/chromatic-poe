// MIT License
//
// Copyright (c) 2020 Alexander Drozdov
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Implementation adapted from https://github.com/SnosMe/poe-dat-viewer/

import {
  SCHEMA_URL,
  SCHEMA_VERSION,
  ValidFor,
  type SchemaFile,
} from "pathofexile-dat-schema";
import {
  readColumn,
  readDatFile,
  getHeaderLength,
  type DatFile,
  type Header,
} from "pathofexile-dat/dat.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileLoader } from "./loader.js";
import type { Config } from "./dat.js";

const TRANSLATIONS = [
  { name: "English", path: "Data" },
  { name: "French", path: "Data/French" },
  { name: "German", path: "Data/German" },
  { name: "Japanese", path: "Data/Japanese" },
  { name: "Korean", path: "Data/Korean" },
  { name: "Portuguese", path: "Data/Portuguese" },
  { name: "Russian", path: "Data/Russian" },
  { name: "Spanish", path: "Data/Spanish" },
  { name: "Thai", path: "Data/Thai" },
  { name: "Traditional Chinese", path: "Data/Traditional Chinese" },
];
const TRANSLATIONS_NONE = TRANSLATIONS[0];

export async function exportTables(
  config: Config,
  outDir: string,
  loader: FileLoader,
) {
  if (!config.tables?.length) return;

  const tables: ReturnType<typeof exportAllRows>[] = [];

  console.log("Loading schema for dat files");
  const schema = await (await fetch(SCHEMA_URL)).json();
  if (schema.version !== SCHEMA_VERSION) {
    console.error(
      'Schema has format not compatible with this package. Check for "pathofexile-dat" updates.',
    );
    process.exit(1);
  }

  const includeTranslations = config.translations?.length
    ? TRANSLATIONS.filter((tr) => config.translations!.includes(tr.name))
    : TRANSLATIONS;
  for (const tr of includeTranslations) {
    await fs.rm(path.join(outDir, tr.name), { recursive: true, force: true });
    await fs.mkdir(path.join(outDir, tr.name), { recursive: true });
  }
  for (const tr of includeTranslations) {
    loader.clearBundleCache();
    for (const target of config.tables) {
      console.log(`Exporting table "${tr.path}/${target.name}"`);
      const datFile = readDatFile(
        ".datc64",
        (await loader.tryGetFileContents(`${tr.path}/${target.name}.datc64`)) ??
          (await loader.getFileContents(
            `${TRANSLATIONS_NONE.path}/${target.name}.datc64`,
          )),
      );
      const headers = importHeaders(
        target.name,
        datFile,
        config,
        schema,
      ).filter((hdr) => target.columns.includes(hdr.name));

      for (const column of target.columns) {
        if (!headers.some((hdr) => hdr.name === column)) {
          console.error(
            `Table "${target.name}" doesn't have a column named "${column}".`,
          );
          process.exit(1);
        }
      }

      const data = exportAllRows(headers, datFile);
      tables.push(data);

      await fs.writeFile(
        path.join(process.cwd(), "tables", tr.name, `${target.name}.json`),
        JSON.stringify(data, null, 2),
      );
    }
  }
  return tables;
}

export function exportAllRows(headers: NamedHeader[], datFile: DatFile) {
  const columns = headers.map((header) => ({
    name: header.name,
    data: readColumn(header, datFile),
  }));

  columns.unshift({
    name: "_index",
    data: Array(datFile.rowCount)
      .fill(undefined)
      .map((_, idx) => idx),
  });

  return Array(datFile.rowCount)
    .fill(undefined)
    .map((_, idx) =>
      Object.fromEntries(columns.map((col) => [col.name, col.data[idx]])),
    );
}

interface NamedHeader extends Header {
  name: string;
}

function importHeaders(
  name: string,
  datFile: DatFile,
  config: Config,
  schema: SchemaFile,
): NamedHeader[] {
  const headers = [] as NamedHeader[];

  const validFor = config.patch?.startsWith("4.")
    ? ValidFor.PoE2
    : ValidFor.PoE1;
  const sch = schema.tables.find(
    (s) => s.name === name && s.validFor & validFor,
  )!;
  let offset = 0;
  for (const column of sch.columns) {
    headers.push({
      name: column.name || "",
      offset,
      type: {
        array: column.array,
        integer:
          // column.type === 'u8' ? { unsigned: true, size: 1 }
          column.type === "u16"
            ? { unsigned: true, size: 2 }
            : column.type === "u32"
              ? { unsigned: true, size: 4 }
              : // : column.type === 'u64' ? { unsigned: true, size: 8 }
                // : column.type === 'i8' ? { unsigned: false, size: 1 }
                column.type === "i16"
                ? { unsigned: false, size: 2 }
                : column.type === "i32"
                  ? { unsigned: false, size: 4 }
                  : // : column.type === 'i64' ? { unsigned: false, size: 8 }
                    column.type === "enumrow"
                    ? { unsigned: false, size: 4 }
                    : undefined,
        decimal:
          column.type === "f32"
            ? { size: 4 }
            : // : column.type === 'f64' ? { size: 8 }
              undefined,
        string: column.type === "string" ? {} : undefined,
        boolean: column.type === "bool" ? {} : undefined,
        key:
          column.type === "row" || column.type === "foreignrow"
            ? {
                foreign: column.type === "foreignrow",
              }
            : undefined,
      },
    });
    offset += getHeaderLength(headers[headers.length - 1], datFile);
  }
  return headers;
}

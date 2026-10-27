/**
 * @license
 * Copyright 2026 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EDGAR-backed {@link S1FixtureDeps} for `fetchS1Fixtures`. Sources candidates
 * from two feeds — recent S-1s (any issuer) and blank-check (SIC 6770) S-1
 * filers so the SPAC floor is satisfiable — then enriches each via the
 * submissions API to obtain `sicCode` + the primary HTML document.
 *
 * Every request goes through the fetch queue ({@link fetchEdgarText}), which
 * paces it and retries a 429. A feed that still fails is thrown rather than
 * read as an empty one: a blocked run used to report "no candidates".
 */

import { describeFailureReason } from "../../util/describeFailure";
import { fetchEdgarText as getText } from "./edgarFixtureFetch";
import type { S1Candidate, S1FixtureDeps } from "./fetchS1Fixtures";

const pad10 = (cik: string): string => cik.replace(/\D/g, "").padStart(10, "0");

async function ciksBySic(sic: string, count: number): Promise<string[]> {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&SIC=${sic}&type=S-1&dateb=&owner=include&count=${count}&output=atom`;
  const xml = await getText(url);
  return [...xml.matchAll(/CIK=(\d+)/g)].map((m) => m[1]);
}

async function recentS1Ciks(count: number): Promise<string[]> {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=S-1&count=${count}&output=atom`;
  const xml = await getText(url);
  return [...xml.matchAll(/edgar\/data\/(\d+)\//g)].map((m) => m[1]);
}

/** Enrich a CIK into a candidate using its latest S-1 filing from submissions. */
async function candidateFromCik(cik: string): Promise<S1Candidate | null> {
  const sub = (await getText(`https://data.sec.gov/submissions/CIK${pad10(cik)}.json`).then(
    JSON.parse
  )) as {
    name: string;
    sicCode?: string;
    filings: { recent: { form: string[]; accessionNumber: string[]; primaryDocument: string[] } };
  };
  const rec = sub.filings.recent;
  const idx = rec.form.findIndex((f) => /^S-1(\/A)?$/.test(f));
  if (idx < 0) return null;
  const primaryDoc = rec.primaryDocument[idx];
  return {
    cik: cik.replace(/\D/g, ""),
    accession: rec.accessionNumber[idx],
    companyName: sub.name,
    sicCode: sub.sicCode,
    primaryDoc: primaryDoc && /\.htm/.test(primaryDoc) ? primaryDoc : undefined,
  };
}

export function edgarS1Deps(
  log: (msg: string) => void = (m) => process.stderr.write(m + "\n")
): S1FixtureDeps {
  return {
    log,
    listCandidates: async () => {
      const [spacCiks, recentCiks] = await Promise.all([ciksBySic("6770", 40), recentS1Ciks(60)]);
      const ciks = [...new Set([...spacCiks, ...recentCiks])];
      const out: S1Candidate[] = [];
      for (const cik of ciks) {
        // One filer that cannot be read is skipped, and said so: the sample
        // only needs enough of them, but a skip is never silent.
        try {
          const c = await candidateFromCik(cik);
          if (c) out.push(c);
        } catch (err) {
          log(`Skipping CIK ${cik}: ${describeFailureReason(err, 200)}`);
        }
      }
      return out;
    },
    fetchHtml: (c: S1Candidate) =>
      getText(
        `https://www.sec.gov/Archives/edgar/data/${c.cik}/${c.accession.replace(/-/g, "")}/${c.primaryDoc}`
      ),
  };
}

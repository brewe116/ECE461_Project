import {get_license_score} from './license_score_calc/license';
import {get_urls, URL_PARSE} from './url_parser';

const arrayToNdjson = require('array-to-ndjson');

interface SCORE_OUT {
  URL: string;
  NetScore: number;
  RampUp: number;
  Correctness: number;
  BusFactor: number;
  ResponsiveMaintainer: number;
  License: number;
}

//get_license_score('git@github.com:davglass/license-checker.git').then(
//  (data: number) => {
//    console.log(data);
//  }
//);

function net_score_formula(subscores: SCORE_OUT): number {
  // prettier-ignore
  const net_score: number =
  subscores.License * (
    (subscores.RampUp) +
    (subscores.Correctness) +
    (subscores.BusFactor * 0.6) +
    (subscores.ResponsiveMaintainer * 0.4)
  );
  return net_score;
}

async function main() {
  const args = process.argv.slice(2);
  console.log(args);

  const urls = await get_urls(args[0]);

  // Each url score computed one by one -> slow!
  const score_list: Promise<SCORE_OUT>[] = urls.map(
    async (url_parse: URL_PARSE) => {
      const score: SCORE_OUT = {
        URL: url_parse.original_url, // SHOULD THIS BE ORIGINAL?
        NetScore: 0,
        RampUp: 0,
        Correctness: 0,
        BusFactor: 0,
        ResponsiveMaintainer: 0,
        License: 0,
      };
      const license_sub_score = get_license_score(url_parse.github_repo_url);

      score.License = await license_sub_score;
      score.NetScore = net_score_formula(score);

      return score;
    }
  );

  // All scores out at same time
  arrayToNdjson(await Promise.all(score_list)).pipe(process.stdout);
}

main();

import {get_license_score} from './license_score_calc/license';
import {get_urls, URL_PARSE} from './url_parser';
import {create_logger} from './logging_setup';
import {get_bus_factor_score} from './bus_factor/bus_factor';
import {get_responsiveness_score} from './responsiveness_factor/responsiveness';

const arrayToNdjson = require('array-to-ndjson');

interface SCORE_OUT {
  URL: string;
  NET_SCORE: number;
  RAMP_UP_SCORE: number;
  CORRECTNESS_SCORE: number;
  BUS_FACTOR_SCORE: number;
  RESPONSIVE_MAINTAINER_SCORE: number;
  LICENSE_SCORE: number;
}

//get_license_score('git@github.com:davglass/license-checker.git').then(
//  (data: number) => {
//    console.log(data);
//  }
//);

function net_score_formula(subscores: SCORE_OUT): number {
  // prettier-ignore
  const net_score: number =
  subscores.LICENSE_SCORE * (
    (subscores.RAMP_UP_SCORE) +
    (subscores.CORRECTNESS_SCORE) +
    (subscores.BUS_FACTOR_SCORE * 0.6) +
    (subscores.RESPONSIVE_MAINTAINER_SCORE * 0.4)
  );
  return net_score;
}

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger.debug(`main args: ${args}`);

  const urls = await get_urls(args[0]);

  // Each url score computed one by one -> slow!
  const score_list: Promise<SCORE_OUT>[] = urls.map(
    async (url_parse: URL_PARSE) => {
      const score: SCORE_OUT = {
        URL: url_parse.original_url, // SHOULD THIS BE ORIGINAL?
        NET_SCORE: 0,
        RAMP_UP_SCORE: 0,
        CORRECTNESS_SCORE: 0,
        BUS_FACTOR_SCORE: 0,
        RESPONSIVE_MAINTAINER_SCORE: 0,
        LICENSE_SCORE: 0,
      };
      const license_sub_score = get_license_score(url_parse.github_repo_url);
      const bus_factor_sub_score = get_bus_factor_score(
        url_parse.github_repo_url
      );
      const responsiveness_sub_score = get_responsiveness_score(
        url_parse.github_repo_url
      );

      score.LICENSE_SCORE = await license_sub_score;
      score.BUS_FACTOR_SCORE = Number((await bus_factor_sub_score).toFixed(3));
      score.RESPONSIVE_MAINTAINER_SCORE = Number(
        (await responsiveness_sub_score).toFixed(2)
      );
      score.NET_SCORE = net_score_formula(score);

      return score;
    }
  );

  // All scores out at same time
  arrayToNdjson(await Promise.all(score_list)).pipe(process.stdout);
}

main();

import {get_number_forks} from '../../src/bus_factor/bus_factor_graphql';
import * as https from 'https';

describe('testing get_number_forks', () => {
  test('should return a number if token is correct', async () => {
    expect(
      await get_number_forks('https://github.com/torvalds/linux')
    ).toBeGreaterThan(30000);
  });
  test('should return undefined since not github', async () => {
    expect(await get_number_forks('https://github./torvalds/linux')).toBe(
      undefined
    );
  });
});
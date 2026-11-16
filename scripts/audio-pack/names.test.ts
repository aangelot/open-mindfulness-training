import { assetName } from './names';

it('turns site file names into ASCII release asset names', () => {
  expect(assetName('https://www.openmindfulness.net/wp-content/uploads/2019/04/P5-ch3-étape-1.mp3')).toBe('p5-ch3-etape-1');
  expect(assetName('https://www.openmindfulness.net/wp-content/uploads/2019/04/P5-ch3-%C3%A9tape-1.mp3')).toBe('p5-ch3-etape-1');
  expect(assetName('https://x.net/a/Exposé%2012%20bis.MP3')).toBe('expose-12-bis');
});

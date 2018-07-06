/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
const assert = require('assert');
const Bundler = require('parcel-bundler');
const fs = require('fs-extra');
const { options, logger } = require('./testBase');
const winston = require('winston');

const params = {
  path: '/hello.md',
  __ow_method: 'get',
  owner: 'trieloff',
  SECRET: '🎶 agent man',
  __ow_headers: {
    'X-Forwarded-Port': '443',
    'X-CDN-Request-Id': '2a208a89-e071-44cf-aee9-220880da4c1e',
    'Fastly-Client': '1',
    'X-Forwarded-Host': 'runtime.adobe.io',
    'Upgrade-Insecure-Requests': '1',
    Host: 'controller-a',
    Connection: 'close',
    'Fastly-SSL': '1',
    'X-Request-Id': 'RUss5tPdgOfw74a68aNc24FeTipGpVfW',
    'X-Branch': 'master',
    'Accept-Language': 'en-US, en;q=0.9, de;q=0.8',
    'X-Forwarded-Proto': 'https',
    'Fastly-Orig-Accept-Encoding': 'gzip',
    'X-Varnish': '267021320',
    DNT: '1',
    'X-Forwarded-For':
          '192.147.117.11, 157.52.92.27, 23.235.46.33, 10.64.221.107',
    'X-Host': 'www.primordialsoup.life',
    Accept:
          'text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, image/apng, */*;q=0.8',
    'X-Real-IP': '10.64.221.107',
    'X-Forwarded-Server': 'cache-lcy19249-LCY, cache-iad2127-IAD',
    'Fastly-Client-IP': '192.147.117.11',
    'Perf-Br-Req-In': '1529585370.116',
    'X-Timer': 'S1529585370.068237,VS0,VS0',
    'Fastly-FF':
          'dc/x3e9z8KMmlHLQr8BEvVMmTcpl3y2YY5y6gjSJa3g=!LCY!cache-lcy19249-LCY, dc/x3e9z8KMmlHLQr8BEvVMmTcpl3y2YY5y6gjSJa3g=!LCY!cache-lcy19227-LCY, dc/x3e9z8KMmlHLQr8BEvVMmTcpl3y2YY5y6gjSJa3g=!IAD!cache-iad2127-IAD, dc/x3e9z8KMmlHLQr8BEvVMmTcpl3y2YY5y6gjSJa3g=!IAD!cache-iad2133-IAD',
    'Accept-Encoding': 'gzip',
    'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
  },
  repo: 'soupdemo',
  ref: 'master',
  selector: 'md',
  branch: 'master',
};

describe('html.htl', () => {
  beforeEach('Run Parcel programmatically on html.htl', (done) => {
    const bundler = new Bundler('./test/example/html.htl', options);
    bundler.bundle().then(() => done());
  });

  it('correct output files have been generated', () => {
    assert.ok(fs.existsSync('./dist/html.js'), 'output file has been generated');
    assert.ok(!fs.existsSync('./dist/html.htl'), 'input file has been passed through');
  });

  it('script can be required', () => {
    assert.ok(fs.existsSync('./dist/html.js'), 'output file has been generated');
    logger.debug(`found generated file ${require.resolve('../../dist/html.js')}`);

    // eslint-disable-next-line import/no-unresolved, global-require
    const script = require('../../dist/html.js');
    assert.ok(script);
  });

  it('script has main function', () => {
    // eslint-disable-next-line import/no-unresolved, global-require
    const script = require('../../dist/html.js');
    assert.ok(script.main);
    assert.equal(typeof script.main, 'function');
  });

  it('script can be executed', (done) => {
    // eslint-disable-next-line import/no-unresolved, global-require
    const script = require('../../dist/html.js');
    const result = script.main(params, { PSSST: 'secret' }, logger);
    assert.ok(result);
    result
      .then((res) => {
        assert.ok(res, 'no response received');
        assert.ok(res.body, 'reponse has no body');
        assert.ok(res.body.match(/Welcome/), 'response body does not contain expected result');
        done();
      })
      .catch(done);
  });

  it('secrets and loggers are honored', (done) => {
    // eslint-disable-next-line import/no-unresolved, global-require
    const script = require('../../dist/html.js');
    let counter = 0;
    const mylogger = winston.createLogger({
      level: 'silly',
      silent: false,
      format: winston.format.printf((info) => {
        if (counter === 0) {
          // that's our validation that the custom log configuration gets picked up
          done();
        }
        counter += 1;
        return `${counter} ${info.level} ${info.message}`;
      }),
      transports: new winston.transports.Console(),
    });

    script.main(params, { SECRETS: 'there' }, mylogger).then((r) => {
      assert.ok(r.body.indexOf('>'));
    });

  });
});

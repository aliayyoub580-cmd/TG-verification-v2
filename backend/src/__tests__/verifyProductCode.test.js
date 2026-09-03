const request = require('supertest');
const app = require('../app');
const { verifyProductCode, MOCK_AUTHENTIC_PRODUCTS } = require('../services/verifyProductCode');

describe('POST /api/verify (App Clip Verification Flow)', () => {
  test('missing code body returns 400 with missing_code status', async () => {
    const res = await request(app).post('/api/verify').send({});
    expect(res.status).toBe(400);
    expect(res.body.authentic).toBe(false);
    expect(res.body.status).toBe('missing_code');
  });

  test('valid mock code returns 200 authentic with product metadata', async () => {
    const res = await request(app)
      .post('/api/verify')
      .send({ code: 'VALID-TG-001' });

    expect(res.status).toBe(200);
    expect(res.body.authentic).toBe(true);
    expect(res.body.productName).toContain('T.G. 20 mg');
    expect(res.body.batch).toBe('B-2024-08X');
    expect(res.body.message).toBeTruthy();
  });

  test('valid barcode (EAN-13) returns authentic', async () => {
    const res = await request(app)
      .post('/api/verify')
      .send({ code: '7840001001234' });

    expect(res.status).toBe(200);
    expect(res.body.authentic).toBe(true);
    expect(res.body.productName).toBeTruthy();
  });

  test('valid mock code submitted as full URL returns 200 authentic', async () => {
    const res = await request(app)
      .post('/api/verify')
      .send({ code: 'https://tg-verification-v2.vercel.app/verify?code=VALID-TG-001' });

    expect(res.status).toBe(200);
    expect(res.body.authentic).toBe(true);
    expect(res.body.productName).toContain('T.G. 20 mg');
  });

  test('invalid / counterfeit code returns authentic false', async () => {
    const res = await request(app)
      .post('/api/verify')
      .send({ code: 'FAKE-COUNTERFEIT-99' });

    expect(res.status).toBe(200);
    expect(res.body.authentic).toBe(false);
    expect(res.body.message).toContain('could not be verified');
  });
});

describe('verifyProductCode service module directly', () => {
  test('returns authentic true for mock registry entries', async () => {
    const result = await verifyProductCode('TG-20MG-BATCH44');
    expect(result.authentic).toBe(true);
    expect(result.batch).toBe('B-2024-44');
    expect(result.manufacturer).toBe('Laboratorios Indufar C.A.');
  });

  test('returns authentic false for empty code', async () => {
    const result = await verifyProductCode('   ');
    expect(result.authentic).toBe(false);
    expect(result.message).toContain('No product code provided');
  });
});

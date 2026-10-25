import path from 'path';
import { test, expect } from '../../src/fixtures/test-fixtures';
import { env } from '../../src/config/env';
import { Post } from '../../src/api/PostsService';
import { readExcel } from '../../src/utils/excelReader';

interface PostRow extends Post {
  testCase: string;
  expectedStatus: number;
}

const rows = readExcel<PostRow & Record<string, unknown>>(path.join(env.testDataDir, 'testdata.xlsx'), 'PostsData');

test.describe('Posts API - all HTTP methods', () => {
  test('GET list returns posts @smoke @api', async ({ postsService }) => {
    const res = await postsService.list({ userId: 1 });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((p) => p.userId === 1)).toBe(true);
  });

  test('GET by id @api', async ({ postsService }) => {
    const res = await postsService.getById(1);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, userId: 1 });
  });

  for (const row of rows) {
    test(`POST ${row.testCase} (from Excel) @api`, async ({ postsService }) => {
      const res = await postsService.create({ userId: row.userId, title: row.title, body: row.body });
      expect(res.status).toBe(row.expectedStatus);
      expect(res.body).toMatchObject({ userId: row.userId, title: row.title, body: row.body });
      expect(res.body.id).toBeDefined();
    });
  }

  test('PUT replaces a post @api', async ({ postsService }) => {
    const res = await postsService.replace(1, { userId: 1, title: 'replaced', body: 'new body' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, title: 'replaced', body: 'new body' });
  });

  test('PATCH updates part of a post @api', async ({ postsService }) => {
    const res = await postsService.update(1, { title: 'patched title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('patched title');
  });

  test('DELETE removes a post @api', async ({ postsService }) => {
    const res = await postsService.remove(1);
    expect(res.status).toBe(200);
  });

  test('GET unknown id returns 404 @api', async ({ postsService }) => {
    const res = await postsService.getById(999_999);
    expect(res.status).toBe(404);
  });

  test('custom headers are sent @api', async ({ uploadHttp }) => {
    const res = await uploadHttp.get<{ headers: Record<string, string> }>('/headers', {
      headers: { 'X-Correlation-Id': 'abc-123' },
    });
    expect(res.status).toBe(200);
    expect(res.body.headers['X-Correlation-Id']).toBe('abc-123');
  });
});

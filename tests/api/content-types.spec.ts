import path from 'path';
import { test, expect } from '../../src/fixtures/test-fixtures';
import { env } from '../../src/config/env';
import { ContentType, FilePart } from '../../src/utils/httpUtils';

// httpbin.org/post echoes what it receives: json, form, files, headers.
interface Echo {
  json: unknown;
  form: Record<string, string>;
  files: Record<string, string>;
  headers: Record<string, string>;
}

const file = (name: string) => path.join(env.testDataDir, 'files', name);

test.describe('Content types', () => {
  test('application/json body @smoke @api', async ({ uploadHttp }) => {
    const res = await uploadHttp.post<Echo>('/post', { body: { hello: 'world' } });
    expect(res.status).toBe(200);
    expect(res.body.headers['Content-Type']).toContain('application/json');
    expect(res.body.json).toEqual({ hello: 'world' });
  });

  test('application/x-www-form-urlencoded @api', async ({ uploadHttp }) => {
    const res = await uploadHttp.post<Echo>('/post', { form: { user: 'john', role: 'qa' } });
    expect(res.body.headers['Content-Type']).toContain('application/x-www-form-urlencoded');
    expect(res.body.form).toEqual({ user: 'john', role: 'qa' });
  });

  test('PUT and PATCH with JSON @api', async ({ uploadHttp }) => {
    const put = await uploadHttp.put<Echo>('/put', { body: { a: 1 } });
    const patch = await uploadHttp.patch<Echo>('/patch', { body: { b: 2 } });
    expect(put.body.json).toEqual({ a: 1 });
    expect(patch.body.json).toEqual({ b: 2 });
  });

  const uploads: Array<{ name: string; mime: string }> = [
    { name: 'sample.png', mime: 'image/png' },
    { name: 'sample.csv', mime: 'text/csv' },
    { name: 'sample.pdf', mime: 'application/pdf' },
    { name: 'sample.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  ];

  for (const u of uploads) {
    test(`multipart/form-data upload: ${u.name} @api`, async ({ uploadHttp }) => {
      const part: FilePart = { field: 'file', filePath: file(u.name) };
      const res = await uploadHttp.upload<Echo>('/post', part, { fields: { description: `upload of ${u.name}` } });

      expect(res.status).toBe(200);
      expect(res.body.headers['Content-Type']).toContain(ContentType.MULTIPART);
      expect(res.body.files.file).toContain(`data:${u.mime}`);
      expect(res.body.form.description).toBe(`upload of ${u.name}`);
    });
  }

  test('multiple files in one multipart request @api', async ({ uploadHttp }) => {
    const res = await uploadHttp.upload<Echo>('/post', [
      { field: 'image', filePath: file('sample.png') },
      { field: 'report', filePath: file('sample.pdf') },
    ]);
    expect(Object.keys(res.body.files).sort()).toEqual(['image', 'report']);
  });

  test('binary response as buffer @api', async ({ uploadHttp }) => {
    const res = await uploadHttp.get<Buffer>('/image/png', { responseType: 'buffer' });
    expect(res.status).toBe(200);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(1, 4).toString()).toBe('PNG');
  });
});

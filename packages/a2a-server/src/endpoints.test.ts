/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type express from 'express';
import { createApp, updateCoderAgentCardUrl } from './agent.js';
import * as fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { Server } from 'node:http';
import type { TaskMetadata } from './types.js';
import type { AddressInfo } from 'node:net';

// Mock the logger to avoid polluting test output
// Comment out to help debug
vi.mock('./logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock Task.create to avoid its complex setup
vi.mock('./task.js', () => {
  class MockTask {
    id: string;
    contextId: string;
    taskState = 'submitted';
    config = {
      getContentGeneratorConfig: vi
        .fn()
        .mockReturnValue({ model: 'gemini-pro' }),
    };
    geminiClient = {
      initialize: vi.fn().mockResolvedValue(undefined),
    };
    constructor(id: string, contextId: string) {
      this.id = id;
      this.contextId = contextId;
    }
    static create = vi
      .fn()
      .mockImplementation((id, contextId) =>
        Promise.resolve(new MockTask(id, contextId)),
      );
    getMetadata = vi.fn().mockImplementation(async () => ({
      id: this.id,
      contextId: this.contextId,
      taskState: this.taskState,
      model: 'gemini-pro',
      mcpServers: [],
      availableTools: [],
    }));
  }
  return { Task: MockTask };
});

type DownloadCall = { bucket: string; name: string; destination: string };
type SignedUrlCall = {
  bucket: string;
  name: string;
  options: Record<string, unknown>;
};
type UploadCall = { bucket: string; args: unknown[] };

const downloadCalls: DownloadCall[] = [];
const signedUrlCalls: SignedUrlCall[] = [];
const uploadCalls: UploadCall[] = [];

vi.mock('@google-cloud/storage', () => {
  return {
    Storage: class {
      bucket(bucketName: string) {
        return {
          file: (objectName: string) => ({
            download: vi.fn(async ({ destination }: { destination: string }) => {
              downloadCalls.push({ bucket: bucketName, name: objectName, destination });
              await fsPromises.writeFile(
                destination,
                `${bucketName}/${objectName}`,
              );
            }),
            getSignedUrl: vi.fn(async (options) => {
              signedUrlCalls.push({
                bucket: bucketName,
                name: objectName,
                options,
              });
              return ['https://signed-url'];
            }),
          }),
          upload: vi.fn(async (...args: unknown[]) => {
            uploadCalls.push({ bucket: bucketName, args });
          }),
        };
      }
    },
  };
});

beforeEach(() => {
  downloadCalls.length = 0;
  signedUrlCalls.length = 0;
  uploadCalls.length = 0;
});

describe('Agent Server Endpoints', () => {
  let app: express.Express;
  let server: Server;
  let testWorkspace: string;
  let originalReleaseBucket: string | undefined;

  const createTask = (contextId: string) =>
    request(app)
      .post('/tasks')
      .send({
        contextId,
        agentSettings: {
          kind: 'agent-settings',
          workspacePath: testWorkspace,
        },
      })
      .set('Content-Type', 'application/json');

  beforeAll(async () => {
    // Create a unique temporary directory for the workspace to avoid conflicts
    testWorkspace = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gemini-agent-test-'),
    );
    originalReleaseBucket = process.env['GCS_RELEASE_BUCKET_NAME'];
    process.env['GCS_RELEASE_BUCKET_NAME'] = 'release-bucket';
    app = await createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        updateCoderAgentCardUrl(port);
        resolve();
      });
    });
  });

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);

          try {
            fs.rmSync(testWorkspace, { recursive: true, force: true });
          } catch (e) {
            console.warn(`Could not remove temp dir '${testWorkspace}':`, e);
          }
          if (originalReleaseBucket === undefined) {
            delete process.env['GCS_RELEASE_BUCKET_NAME'];
          } else {
            process.env['GCS_RELEASE_BUCKET_NAME'] = originalReleaseBucket;
          }
          resolve();
        });
      }),
  );

  it('should create a new task via POST /tasks', async () => {
    const response = await createTask('test-context');
    expect(response.status).toBe(201);
    expect(response.body).toBeTypeOf('string'); // Should return the task ID
  }, 7000);

  it('should get metadata for a specific task via GET /tasks/:taskId/metadata', async () => {
    const createResponse = await createTask('test-context-2');
    const taskId = createResponse.body;
    const response = await request(app).get(`/tasks/${taskId}/metadata`);
    expect(response.status).toBe(200);
    expect(response.body.metadata.id).toBe(taskId);
  }, 6000);

  it('should get metadata for all tasks via GET /tasks/metadata', async () => {
    const createResponse = await createTask('test-context-3');
    const taskId = createResponse.body;
    const response = await request(app).get('/tasks/metadata');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    const taskMetadata = response.body.find(
      (m: TaskMetadata) => m.id === taskId,
    );
    expect(taskMetadata).toBeDefined();
  });

  it('should return 404 for a non-existent task', async () => {
    const response = await request(app).get('/tasks/fake-task/metadata');
    expect(response.status).toBe(404);
  });

  it('should return agent metadata via GET /.well-known/agent-card.json', async () => {
    const response = await request(app).get('/.well-known/agent-card.json');
    const port = (server.address() as AddressInfo).port;
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Gemini SDLC Agent');
    expect(response.body.url).toBe(`http://localhost:${port}/`);
  });

  it('should bundle audio and transcript via POST /bundle', async () => {
    vi.useFakeTimers();
    try {
      const fixedDate = new Date('2025-01-02T03:04:05.678Z');
      vi.setSystemTime(fixedDate);

      const response = await request(app)
        .post('/bundle')
        .send({
          audio: 'gs://audio-bucket/path/audio.webm',
          session: 'gs://session-bucket/path/session.json',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.object).toBe(
        'gs://release-bucket/releases/AVC_2025-01-02T03-04-05-678Z.zip',
      );
      expect(response.body.downloadUrl).toBe('https://signed-url');

      expect(downloadCalls).toEqual([
        expect.objectContaining({
          bucket: 'audio-bucket',
          name: 'path/audio.webm',
          destination: expect.stringMatching(/^\/tmp\/audio-\d+\.webm$/),
        }),
        expect.objectContaining({
          bucket: 'session-bucket',
          name: 'path/session.json',
          destination: expect.stringMatching(/^\/tmp\/session-\d+\.json$/),
        }),
      ]);

      expect(uploadCalls).toHaveLength(1);
      expect(uploadCalls[0]?.bucket).toBe('release-bucket');
      expect(uploadCalls[0]?.args[0]).toBe(
        '/tmp/AVC_2025-01-02T03-04-05-678Z.zip',
      );
      expect(uploadCalls[0]?.args[1]).toEqual({
        destination: 'releases/AVC_2025-01-02T03-04-05-678Z.zip',
      });

      expect(signedUrlCalls).toEqual([
        expect.objectContaining({
          bucket: 'release-bucket',
          name: 'releases/AVC_2025-01-02T03-04-05-678Z.zip',
        }),
      ]);
      expect(signedUrlCalls[0]?.options).toMatchObject({
        version: 'v4',
        action: 'read',
      });
      const expires = signedUrlCalls[0]?.options?.expires as number;
      expect(typeof expires).toBe('number');
      expect(expires).toBe(
        fixedDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

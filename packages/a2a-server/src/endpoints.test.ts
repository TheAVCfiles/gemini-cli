/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type express from 'express';
import { createApp, updateCoderAgentCardUrl } from './agent.js';
import * as fs from 'node:fs';
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

describe('Agent Server Endpoints', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  let testWorkspace: string;

  const createTask = async (contextId: string) => {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contextId,
        agentSettings: {
          kind: 'agent-settings',
          workspacePath: testWorkspace,
        },
      }),
    });

    return {
      status: response.status,
      body: await response.json(),
    };
  };

  beforeAll(async () => {
    // Create a unique temporary directory for the workspace to avoid conflicts
    testWorkspace = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gemini-agent-test-'),
    );
    app = await createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://localhost:${port}`;
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
    const response = await fetch(`${baseUrl}/tasks/${taskId}/metadata`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.metadata.id).toBe(taskId);
  }, 6000);

  it('should get metadata for all tasks via GET /tasks/metadata', async () => {
    const createResponse = await createTask('test-context-3');
    const taskId = createResponse.body;
    const response = await fetch(`${baseUrl}/tasks/metadata`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const taskMetadata = body.find((m: TaskMetadata) => m.id === taskId);
    expect(taskMetadata).toBeDefined();
  });

  it('should return 404 for a non-existent task', async () => {
    const response = await fetch(`${baseUrl}/tasks/fake-task/metadata`);
    expect(response.status).toBe(404);
  });

  it('should return agent metadata via GET /.well-known/agent-card.json', async () => {
    const response = await fetch(`${baseUrl}/.well-known/agent-card.json`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe('Gemini SDLC Agent');
    expect(body.url).toBe(`${baseUrl}/`);
  });
});

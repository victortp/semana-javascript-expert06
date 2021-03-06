import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import config from '../../../server/config.js';
import TestUtil from '../_util/testUtil.js';
import { handler } from '../../../server/routes.js';
import { Controller } from '../../../server/controller.js';

const {
  pages,
  location,
  constants: { CONTENT_TYPE }
} = config;

const makeParams = (method, url) => {
  const params = TestUtil.defaultHandleParams();
  params.request.method = method;
  params.request.url = url;

  return params;
};

describe('#Routes - test suite for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('GET / - should redirect to home page', async () => {
    const params = makeParams('GET', '/');
    await handler(...params.values());

    expect(params.response.writeHead).toHaveBeenCalledWith(302, {
      Location: location.home
    });
    expect(params.response.end).toHaveBeenCalled();
  });

  test(`GET /home - should respond with ${pages.homeHTML} file stream`, async () => {
    const params = makeParams('GET', '/home');
    const mockFileStream = TestUtil.generateReadableStream(['data']);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream
      });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.homeHTML);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
  });

  test(`GET /controller - should respond with ${pages.controllerHTML} file stream`, async () => {
    const params = makeParams('GET', '/controller');
    const mockFileStream = TestUtil.generateReadableStream(['data']);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream
      });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.controllerHTML);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
  });

  test(`GET /file.ext - should respond with file stream`, async () => {
    const filename = 'file.ext';
    const params = makeParams('GET', `/${filename}`);
    const mockFileStream = TestUtil.generateReadableStream(['data']);
    const expectedType = '.ext';

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType
      });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(`/${filename}`);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
    expect(params.response.writeHead).not.toHaveBeenCalled();
  });

  test(`GET /index.html - should respond with file stream and correct Content-Type`, async () => {
    const filename = 'index.html';
    const params = makeParams('GET', `/${filename}`);
    const mockFileStream = TestUtil.generateReadableStream(['data']);
    const expectedType = '.html';

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType
      });

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(`/${filename}`);
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response);
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': CONTENT_TYPE[expectedType]
    });
  });

  test(`POST /unknown - given an inexistent route it should respond with 404`, async () => {
    const params = makeParams('POST', '/unknown');

    await handler(...params.values());

    expect(params.response.writeHead).toHaveBeenCalledWith(404);
    expect(params.response.end).toHaveBeenCalled();
  });

  describe('exceptions', () => {
    test('given an inexistent file it should respond with 404', async () => {
      const params = makeParams('GET', '/index.png');

      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('Error: ENOENT: no such file or directory'));

      await handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(404);
      expect(params.response.end).toHaveBeenCalled();
    });

    test('given an error it should respond with 500', async () => {
      const params = makeParams('GET', '/route');

      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('Error:'));

      await handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(500);
      expect(params.response.end).toHaveBeenCalled();
    });
  });
});

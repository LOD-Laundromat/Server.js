var LinkedDataFragmentsServer = require('../lib/LinkedDataFragmentsServer');

var request = require('supertest'),
    fs = require('fs'),
    http = require('http'),
    url = require('url');

describe('LinkedDataFragmentsServer', function () {
  describe('A LinkedDataFragmentsServer instance with one controller', function () {
    var server, controller, client;
    before(function () {
      controller = {
        handleRequest: sinon.spy(function (request, response) {
          switch (request.url) {
            case '/handle':
              return response.end('body contents'), true;
            case '/error':
              throw new Error('error message');
            default:
              return false;
          }
        }),
      };
      server = new LinkedDataFragmentsServer({
        controllers: [ controller ],
        log: sinon.stub(),
      });
      client = request.agent(server);
    });
    beforeEach(function () {
      controller.handleRequest.reset();
    });

    it('should send CORS headers', function (done) {
      client.head('/').expect(function (response) {
        response.headers.should.have.property('access-control-allow-origin', '*');
      }).end(done);
    });

    it('should not allow POST requests', function (done) {
      client.post('/').expect(function (response) {
        controller.handleRequest.should.not.have.been.called;
        response.should.have.property('statusCode', 405);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'The HTTP method "POST" is not allowed; try "GET" instead.');
      }).end(done);
    });

    it('should send a body with GET requests', function (done) {
      client.get('/handle').expect(function (response) {
        controller.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 200);
        response.should.have.property('text', 'body contents');
      }).end(done);
    });

    it('should not send a body with HEAD requests', function (done) {
      client.head('/handle').expect(function (response) {
        controller.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 200);
        response.should.have.property('text', '');
      }).end(done);
    });

    it('should not send a body with OPTIONS requests', function (done) {
      client.options('/handle').expect(function (response) {
        controller.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 200);
        response.should.have.property('text', '');
      }).end(done);
    });

    it('should error when the controller cannot handle the request', function (done) {
      client.get('/unsupported').expect(function (response) {
        controller.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 500);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'Application error: No controller for /unsupported');
      }).end(done);
    });

    it('should error when the controller errors', function (done) {
      client.get('/error').expect(function (response) {
        controller.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 500);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'Application error: error message');
      }).end(done);
    });
  });

  describe('A LinkedDataFragmentsServer instance with two controllers', function () {
    var server, controllerA, controllerB, client;
    before(function () {
      controllerA = {
        handleRequest: sinon.spy(function (request, response) {
          switch (request.url) {
            case '/handleA':
              return response.end('body contents A'), true;
            case '/errorA':
              throw new Error('error message A');
            default:
              return false;
          }
        }),
      };
      controllerB = {
        handleRequest: sinon.spy(function (request, response) {
          switch (request.url) {
            case '/handleB':
              return response.end('body contents B'), true;
            case '/errorB':
              throw new Error('error message B');
            default:
              return false;
          }
        }),
      };
      server = new LinkedDataFragmentsServer({
        controllers: [ controllerA, controllerB ],
        log: sinon.stub(),
      });
      client = request.agent(server);
    });
    beforeEach(function () {
      controllerA.handleRequest.reset();
      controllerB.handleRequest.reset();
    });

    it('should not allow POST requests', function (done) {
      client.post('/').expect(function (response) {
        controllerA.handleRequest.should.not.have.been.called;
        controllerB.handleRequest.should.not.have.been.called;
        response.should.have.property('statusCode', 405);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'The HTTP method "POST" is not allowed; try "GET" instead.');
      }).end(done);
    });

    it('should use the first controller when it can handle the request', function (done) {
      client.get('/handleA').expect(function (response) {
        controllerA.handleRequest.should.have.been.calledOnce;
        controllerB.handleRequest.should.not.have.been.called;
        response.should.have.property('statusCode', 200);
        response.should.have.property('text', 'body contents A');
      }).end(done);
    });

    it('should use the second controller when the first cannot handle the request', function (done) {
      client.get('/handleB').expect(function (response) {
        controllerA.handleRequest.should.have.been.calledOnce;
        controllerB.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 200);
        response.should.have.property('text', 'body contents B');
      }).end(done);
    });

    it('should error when neither controller can handle the request', function (done) {
      client.get('/unsupported').expect(function (response) {
        controllerA.handleRequest.should.have.been.calledOnce;
        controllerB.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 500);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'Application error: No controller for /unsupported');
      }).end(done);
    });

    it('should error when the first controller errors', function (done) {
      client.get('/errorA').expect(function (response) {
        controllerA.handleRequest.should.have.been.calledOnce;
        controllerB.handleRequest.should.not.have.been.called;
        response.should.have.property('statusCode', 500);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'Application error: error message A');
      }).end(done);
    });

    it('should error when the second controller errors', function (done) {
      client.get('/errorB').expect(function (response) {
        controllerA.handleRequest.should.have.been.calledOnce;
        controllerB.handleRequest.should.have.been.calledOnce;
        response.should.have.property('statusCode', 500);
        response.headers.should.have.property('content-type', 'text/plain;charset=utf-8');
        response.should.have.property('text', 'Application error: error message B');
      }).end(done);
    });
  });
});

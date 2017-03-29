//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
var app = require('../server/index');
let should = chai.should();




chai.use(chaiHttp);

//Our parent block
describe('API', () => {
 /*
  * Test the /GET route
  */
  describe('/GET X', () => {
	  it('it should GET X', (done) => {
			chai.request(app)
		    .get('/ENTERURL')
		    .end((err, res) => {
			  	res.should.have.status(200);
		      done();
		    });
	  });
  });
 
 /*
  * Test the /GET/:id route
  */

  describe('/GET/ X/:X_id ', () => {
      it('it should GET a single X by the given id', (done) => {

          let id = 'X'

          chai.request(app)
              .get('/ENTERURL/X/' + id)
              .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  res.body.should.have.property('article').should.be.a('object');
                  res.body.article.should.have.property('id');
                  res.body.article.should.have.property('name');
                  res.body.article.should.have.property('title');
                  res.body.article.should.have.property('body');

                  done();
              });
      });
      it('it should not GET X by an invalid id', (done) => {

          let id = 'XX'

          chai.request(app)
              .get('/ENTERURL/X/' + id)
              .end((err, res) => {
                  res.should.have.status(404);
                  done();
              });
      });
  });
});

 


import express from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'
import helpers from '../utils/helpers'


const app = express();
const cache = {};

// configure app
app.use(logger('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 9655; // set our port

const homepageData = {}

// DEAL WITH CORS  ----------------------------------

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
}
app.use(allowCrossDomain)

// ROUTES FOR OUR API
// =============================================================================

// create our router
const router = express.Router();

// middleware to use for all requests
router.use((req, res, next) => {

})

// test route to make sure everything is working (accessed at GET http://localhost:3000/api)
router.get('/', (req, res) => {

    res.json({})
})


router.get('/content', (req, res) => {

})



router.get('/health', function (req, res) {
    helpers.performHealthCheck().then((response) => {
        res.sendStatus(typeof response !== "undefined" ? 200 : 503)
    })
})

router.get('/health/status', (req, res) => {
    helpers.performHealthCheckStatus().then((response) => {
        res.json(response)
    })
})

// REGISTER OUR ROUTES -------------------------------
app.use('/', router);





// START THE SERVER
// =============================================================================
app.listen(port);
console.log('server running on ' + port);


//export module for testing
module.exports = app;

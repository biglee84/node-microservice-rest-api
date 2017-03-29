/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "bin/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _axios = __webpack_require__(5);

var _axios2 = _interopRequireDefault(_axios);

var _cheerio = __webpack_require__(6);

var _cheerio2 = _interopRequireDefault(_cheerio);

var _zenConfig = __webpack_require__(4);

var _http = __webpack_require__(7);

var _http2 = _interopRequireDefault(_http);

var _moment = __webpack_require__(8);

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NodeCache = __webpack_require__(9);
var zenCache = new NodeCache({ stdTTL: _zenConfig.cache.ttl || 600, checkperiod: _zenConfig.cache.period || 60 });

var labelName = _zenConfig.features.filterByLabel.active ? _zenConfig.features.filterByLabel.labelName : null;

var env = void 0;
(function () {
    switch (process.env.NODE_ENV) {
        case 'prod':
        case 'production':
            env = 'production';
            break;
        case 'dev':
        case 'development':
        default:
            env = 'development';
            break;
    }
})();

function invalidateCache() {
    zenCache.flushAll();
}

function makeZendeskRequestComplete(url) {
    var result = [],
        cachedResult = zenCache.get(url);

    if (typeof cachedResult !== "undefined") {
        return Promise.resolve(cachedResult);
    }

    return _axios2.default.get(url).then(function (data) {
        result = [data.data];
        var page_count = data.data.page_count;
        var promises = [];
        if (page_count > 1) {

            for (var i = 2; i <= page_count; i++) {
                console.log(url + (url.indexOf('?') !== -1 ? '&' : '?') + ('page=' + i));
                promises.push(_axios2.default.get(url + (url.indexOf('?') !== -1 ? '&' : '?') + ('page=' + i)));
            }
        }

        return _axios2.default.all(promises);
    }).then(function (responses) {
        if (responses && Array.isArray(responses)) {
            var subsequentResults = responses.map(function (subsequentResult) {
                return subsequentResult.data;
            });
            result = result.concat(subsequentResults);
        }
        zenCache.set(url, result);
        return result;
    }).catch(function (err) {
        console.log("makeZendeskRequestComplete - err", err);
        return null;
    });
}

//Only returns the first response - makeZendeskRequestComplete should be used if paginated results are expected
function makeZendeskRequest(url) {
    return makeZendeskRequestComplete(url).then(function (responses) {
        return responses[0];
    });
}

function performHealthCheck() {
    return makeZendeskRequest(_zenConfig.urls.baseUrl + '/locales.json');
}

function performHealthCheckStatus() {
    return _axios2.default.get('https://status.zendesk.com/api/pod_id?domain=beautybay.zendesk.com').then(function (response) {
        return response.data.id;
    }).then(function (podId) {
        return _axios2.default.get('https://status.zendesk.com/api/components').then(function (response) {
            var components = [];
            if (response && response.data && Array.isArray(response.data)) {
                console.log("filter components by pod id");
                components = response.data.filter(function (component) {
                    return component.pod_id === podId;
                });
                console.log('filtered components', components.length);
            }
            return components.map(function (component) {
                return { name: component.name, status: component.status };
            });
        });
    });
}

function retrieveFromCache(key) {
    return zenCache.get(key);
}

function addToCache(key, value) {
    return zenCache.set(key, value);
}

function isValidLocale(locale) {

    return makeZendeskRequest(_zenConfig.urls.baseUrl + '/locales.json').then(function (response) {
        var valid = false;
        if (response && response.locales && Array.isArray(response.locales)) {
            response.locales.some(function (localeData) {
                valid = localeData.locale === locale;
                return valid;
            });
        }
        return valid ? locale.toLowerCase() : 'en-gb'; //returns a default of en-gb rather than reporting an invalid locale
    });
}

function getCategories(locale) {
    return makeZendeskRequest(_zenConfig.urls.baseUrl + '/help_center/' + locale + '/categories.json');
}

function getSectionsByCategory(categoryId, locale) {
    return makeZendeskRequest(_zenConfig.urls.baseUrl + '/help_center/' + locale + '/categories/' + categoryId + '/sections.json');
}

function getSectionsForAllCategories(categories, homepageData, locale) {
    var sec_p = [];
    categories.forEach(function (cat) {
        sec_p.push(getSectionsByCategory(cat, locale));
    });
    return _axios2.default.all(sec_p).then(function (responses) {
        responses.forEach(function (response) {
            if (response.sections && Array.isArray(response.sections)) {
                response.sections.forEach(function (section) {
                    homepageData[section.category_id].sections.push({
                        id: section.id,
                        name: section.name,
                        locale: section.locale,
                        position: section.position,
                        linkName: section.url.match(new RegExp('/' + section.id + '.*'))[0].replace('/' + section.id + '-', "").replace(".json", ""),
                        articles: []
                    });
                });
            }
        });
        for (var categoryId in homepageData) {
            if (!homepageData.hasOwnProperty(categoryId)) continue;

            //Sequence Sections array by position, title
            homepageData[categoryId].sections.sort(function (a, b) {
                //position
                if (a.position < b.position) return -1;
                if (a.position > b.position) return 1;
                //title
                var aTitle = a.title.toLowerCase(),
                    bTitle = b.title.toLowerCase;
                if (aTitle < bTitle) return -1;
                if (aTitle > bTitle) return 1;
                return 0;
            });
        }
        return homepageData;
    }).catch(function (err) {
        console.log("getSectionsForAllCategories - err", err);
    });
}

//TODO create generic function for collecting paged data for any url e.g. makeRequest(url)
function getAllArticles(params, locale) {
    var url = _zenConfig.urls.baseUrl + '/help_center/' + locale + '/articles.json?' + _zenConfig.urls.baseParams + (params ? '&' + params : ''),
        result = [];

    return makeZendeskRequestComplete(_zenConfig.urls.baseUrl + '/help_center/' + locale + '/articles.json?' + _zenConfig.urls.baseParams + (params ? '&' + params : '')).then(function (responses) {
        responses.map(function (res) {
            return res.articles;
        }).forEach(function (articlesArray) {
            result = result.concat(articlesArray);
        });

        result = result.map(function (article) {
            article.linkName = article.url.match(new RegExp('/' + article.id + '.*'))[0].replace('/' + article.id + '-', "").replace(".json", "");
            article.body = removeStylingFromArticleBody(article.body);
            return article;
        });

        return result;
    }).catch(function (err) {
        console.log("getAllArticles - err", err);
    });
}

function getArticleById(articleId, locale) {
    return makeZendeskRequest(_zenConfig.urls.baseUrl + '/help_center/' + locale + '/articles/' + articleId + '.json').then(function (response) {
        if (response && response.article && response.article.body) {
            response.article.linkName = response.article.url.match(new RegExp('/' + response.article.id + '.*'))[0].replace('/' + response.article.id + '-', "").replace(".json", "");
            response.article.body = removeStylingFromArticleBody(response.article.body);
        }
        return response;
    });
}

function removeStylingFromArticleBody(articleBody) {
    //load articleBody into cheerio
    var $ = _cheerio2.default.load(articleBody);
    //strip out all inline style attributes
    $('[style]').removeAttr("style");
    //remove font tags
    $('font').remove();
    return $.html();
}

function createHomepageSections(articleData, homepageData) {
    var emptySectionIndexes = [];

    var _loop = function _loop(categoryId) {
        if (!homepageData.hasOwnProperty(categoryId)) return 'continue';

        var articlesArray = [];
        homepageData[categoryId].sections.forEach(function (section, sectionIndex) {
            if (articleData && Array.isArray(articleData)) {
                articlesArray = articleData.filter(function (article) {
                    return article.section_id === section.id && (labelName ? article.label_names.includes(labelName) : true);
                });
            }
            articleData.map(function (article) {
                return {
                    id: article.id,
                    name: article.name,
                    title: article.title,
                    linkName: article.linkName,
                    body: article.body,
                    position: article.position,
                    promoted: article.promoted
                };
            });
            //Sort section articles by promoted, position and title
            //TODO - Reassess this as the number and sequence of articles will change before this needs to be finalised
            articlesArray.sort(function (a, b) {
                //promoted
                if (a.promoted && !b.promoted) {
                    return -1;
                }
                if (!a.promoted && b.promoted) {
                    return 1;
                }
                //position - not convinced this is actually used
                if (a.position < b.position) return -1;
                if (a.position > b.position) return 1;
                //title
                var aTitle = a.title.toLowerCase(),
                    bTitle = b.title.toLowerCase;
                if (aTitle < bTitle) return -1;
                if (aTitle > bTitle) return 1;
                return 0;
            });
            //Return articles as an array

            if (articlesArray.length === 0) {
                emptySectionIndexes.push(sectionIndex);
            } else {
                homepageData[categoryId].sections[sectionIndex].articles = articlesArray;
            }
        });

        for (var i = emptySectionIndexes.length - 1; i >= 0; i--) {
            homepageData[categoryId].sections.splice(emptySectionIndexes[i], 1);
        }
    };

    for (var categoryId in homepageData) {
        var _ret = _loop(categoryId);

        if (_ret === 'continue') continue;
    }

    return homepageData;
}

function getTrackingData(orderId) {

    return _axios2.default.get('http://beautybay.metapack.com/metatrack/track?retailerId=3007&orderRef=' + orderId).then(function (response) {
        var $ = _cheerio2.default.load(response.data),
            trackingData = {
            status: $('span.parcel-status-message').text(),
            statusMsg: $('td.parcel[align="right"]').find('b').text(),
            statusHistory: $('td.history > table').html(),
            parcelCount: $('td.parcel[align="left"]').find('b').eq(0).text(),
            parcelTotal: $('td.parcel[align="left"]').find('b').eq(1).html(),
            trackingCode: $('td.parcel[align="left"]').find('b').eq(2).html(),
            otherParcelsLink: null,
            carrierLink: $('a.carrier-link').attr('href')
        };

        if (parseInt(trackingData.parcelTotal, 10) > 1) {
            trackingData.otherParcelsLink = $('span.metatrack-link > a').attr('href');
        }

        $('td.order span.order-data').each(function (i, elem) {
            var $elem = $(elem);
            switch (i) {
                case 2:
                    trackingData.carrierName = $elem.text();
                    break;
                case 3:
                    trackingData.carrierReference = $elem.text();
                    break;
                case 4:
                    trackingData.consignmentCode = $elem.text();
                    break;
            }
        });

        return trackingData;
    });
}

var contactFormURL = env === "production" ? _zenConfig.urls.contactFormUrlLive : _zenConfig.urls.contactFormUrlQA;
function sendContactForm(form) {
    return _axios2.default.post(contactFormURL, form);
}

function getTimezone() {
    return (0, _moment2.default)().isDST() ? 'BST' : 'GMT';
}

exports.getAllArticles = getAllArticles;
exports.getArticleById = getArticleById;
exports.createHomepageSections = createHomepageSections;
exports.getCategories = getCategories;
exports.getSectionsByCategory = getSectionsByCategory;
exports.getSectionsForAllCategories = getSectionsForAllCategories;
exports.isValidLocale = isValidLocale;
exports.addToCache = addToCache;
exports.retrieveFromCache = retrieveFromCache;
exports.makeZendeskRequest = makeZendeskRequest;
exports.makeZendeskRequestComplete = makeZendeskRequestComplete;
exports.getTrackingData = getTrackingData;
exports.performHealthCheck = performHealthCheck;
exports.performHealthCheckStatus = performHealthCheckStatus;
exports.invalidateCache = invalidateCache;
exports.sendContactForm = sendContactForm;
exports.getTimezone = getTimezone;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("morgan");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.auth = {
    username: 'simon.harrison@beautybay.com',
    token: '7BFJMqCQOhyAjor4NNxBAPdsrLQ1HmaePNPIabpt',
    remoteUri: 'https://beautybay.zendesk.com/api/v2/'
};

exports.urls = {
    baseUrl: 'https://beautybay.zendesk.com/api/v2/',
    locale: 'en-gb',
    baseParams: 'per_page=100',
    contactFormUrlLive: 'http://beautybay.com/api/customerservicesquery/raise',
    contactFormUrlQA: 'http://webqa/api/customerservicesquery/raise'
};
exports.features = {
    filterByLabel: {
        active: true,
        labelName: 'cs-homepage'
    }

};

exports.cache = {
    ttl: 600,
    period: 120
};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("axios");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("cheerio");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("node-cache");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _express = __webpack_require__(2);

var _express2 = _interopRequireDefault(_express);

var _morgan = __webpack_require__(3);

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = __webpack_require__(1);

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _helpers = __webpack_require__(0);

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var cache = {};

// configure app
app.use((0, _morgan2.default)('dev')); // log requests to the console

// configure body parser
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_bodyParser2.default.json());

var port = 9655; // set our port

var homepageData = {};

// DEAL WITH CORS  ----------------------------------

var allowCrossDomain = function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
};
app.use(allowCrossDomain);

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = _express2.default.Router();

// middleware to use for all requests
router.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// test route to make sure everything is working (accessed at GET http://localhost:3000/api)
router.get('/', function (req, res) {

    res.json({});
});

router.get('/articles', function (req, res) {
    _helpers2.default.isValidLocale(req.query.locale).then(function (locale) {
        _helpers2.default.getAllArticles('', locale).then(function (response) {
            res.json({ count: response.length, articles: response });
        });
    });
});

router.get('/homepage/articles/:categoryId', function (req, res) {
    var homepageData = _helpers2.default.retrieveFromCache("homepageData");
    var categoryId = req.params.categoryId || '200002641';

    if (typeof homepageData !== "undefined") {
        res.json(homepageData[categoryId]); //TODO Assumes categoryId is valid
        return;
    }

    homepageData = {};
    _helpers2.default.isValidLocale(req.query.locale).then(function (locale) {
        _helpers2.default.getCategories(locale).then(function (data) {
            data.categories.forEach(function (element) {
                homepageData[element.id] = {
                    id: element.id,
                    name: element.name,
                    sections: []
                };
            }, undefined);
        }).then(function () {
            //populate cats with sections
            var cats = Object.keys(homepageData);
            _helpers2.default.getSectionsForAllCategories(cats, homepageData, locale)
            //populate articles
            .then(function (homepageData) {
                _helpers2.default.getAllArticles('', locale).then(function (response) {
                    homepageData = _helpers2.default.createHomepageSections(response, homepageData);
                    _helpers2.default.addToCache("homepageData", homepageData);
                    res.json(homepageData[categoryId]); //TODO Assumes categoryId is valid
                }).catch(function (err) {
                    console.log("/homepage/articles - err", err);
                    res.status(500).send();
                });
            });
        });
    });
});

router.get('/articles/:article_id', function (req, res) {
    _helpers2.default.getTimezone();
    var articleId = req.params.article_id;
    _helpers2.default.isValidLocale(req.query.locale).then(function (locale) {
        _helpers2.default.getArticleById(articleId, locale).then(function (response) {
            res.json(response);
        }).catch(function (err) {
            console.log("/articles/:article_id - err", err);
            res.status(404).send(); //Article not found
        });
    });
});

router.get('/track/:order_id', function (req, res) {
    var orderId = req.params.order_id;
    _helpers2.default.getTrackingData(orderId).then(function (response) {
        if (response.status) {
            res.json(response);
        } else {
            res.json({ error: true, message: "Invalid Order Id" });
        }
    });
});
router.post('/contact', function (req, res) {
    var reqForm = req.body;

    console.log('/contact', reqForm, typeof reqForm === 'undefined' ? 'undefined' : _typeof(reqForm));

    //TODO endpoint not expecting postcode but reqForm can include it
    _helpers2.default.sendContactForm({
        "Email": reqForm.email,
        "Name": reqForm.name,
        "Contact": null, //TODO Add to front end form?
        "Reason": reqForm.selectedOption,
        "OrderNumber": reqForm.orderNumber,
        "Message": reqForm.message,
        "CustomerId": null,
        "PostCode": reqForm.postcode

    }).then(function (response) {
        //TODO handle status when API is updated
        if (response.status === 201) {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    }).catch(function () {
        res.sendStatus(503);
    });
});

router.get('/health', function (req, res) {
    _helpers2.default.performHealthCheck().then(function (response) {
        res.sendStatus(typeof response !== "undefined" ? 200 : 503);
    });
});

router.get('/health/status', function (req, res) {
    _helpers2.default.performHealthCheckStatus().then(function (response) {
        res.json(response);
    });
});

router.get('/util/invalidate-cache', function (req, res) {
    _helpers2.default.invalidateCache();
    res.sendStatus(200);
});

router.get('/util/timezone', function (req, res) {
    res.json(_helpers2.default.getTimezone());
});

// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('server running on ' + port);

//export module for testing
module.exports = app;

/***/ })
/******/ ]);
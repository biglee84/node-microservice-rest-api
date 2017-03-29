import axios from 'axios'


let env
(function () {
    switch (process.env.NODE_ENV) {
        case 'prod':
        case 'production':
            env = 'production'
            break;
        case 'dev':
        case 'development':
        default:
            env = 'development'
            break;
    }
})()


function performHealthCheck () {
    return true
}

function performHealthCheckStatus () {
    return true
}


exports.performHealthCheck = performHealthCheck
exports.performHealthCheckStatus = performHealthCheckStatus

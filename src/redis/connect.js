const env         = require('../../.env')
const redis       = require('redis')
const client = redis.createClient(env.redisEndPoint, {auth_pass: env.redisAuthPass});

client.on('connect', function() {
    console.log('Redis client connected');
})
client.on('error', function (err) {
    console.log('Something went wrong ' + err);
})

module.exports = {
    redisClient: client
}
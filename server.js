const express = require('express')
const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://test.mosquitto.org')
const app = express()
const { v4: uuidv4 } = require('uuid');
const os = require("os");
const cluster = require("cluster");
const cpuCores = os.cpus().length;

if (cluster.isMaster) {
    var instance = 0;
    while (instance < cpuCores) {
      cluster.fork();
      ++instance;
    }
} else { 
 
    client.on('connect', function () {

        app.get('/', async (req, res) => {
            console.log('request');
            try {
                const result = await createAction('test')
                res.json(result)
            } catch (error) {
                res.json(error)
            }
        
        })
        app.listen(4200)
    })
}



const createAction = (topic, payload, config) => {
    return new Promise( (resolve, reject) => {
        const id = uuidv4()
        const successTopic = `${topic}/${id}/SUCCESS`;
        const failedTopic = `${topic}/${id}/FAILED`;
        const timeout = setTimeout(() => {
            reject({error: 'Something went wrong.'})
        }, config?.timeout ?? 10000);

        client.subscribe(successTopic)
        client.subscribe(failedTopic)
        client.publish(`${topic}/${id}/TRY`, JSON.stringify({
            id,
            payload
        }))

        client.once('message', (responseTopic, message) => {
            client.unsubscribe(successTopic)
            client.unsubscribe(failedTopic)

            if(responseTopic === successTopic) {
                clearTimeout(timeout)
                resolve(message.toString())
            } else {
                clearTimeout(timeout)
                reject({error: 'Something went wrong.'})
            }
        })
    })
}
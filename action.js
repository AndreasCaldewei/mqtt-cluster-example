const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://test.mosquitto.org')
const os = require("os");
const cluster = require("cluster");
const cpuCores = os.cpus().length;

if (cluster.isMaster) {
    let instance = 0;
    while (instance < cpuCores) {
      cluster.fork();
      ++instance;
    }
} else { 
    client.subscribe('$share/1/test/+/TRY')
    client.on('message', function (topic, message) {
        try {
            const { id } = JSON.parse(message.toString())
            console.log(id);
            setTimeout(() => {
                client.publish(`test/${id}/SUCCESS`, JSON.stringify({test: 'WHOOP'}))
            }, 2000);
        } catch (error) {
            client.publish(`test/${id}/FAILED`, JSON.stringify({test: 'WHOOP'}))
        }
    })
}

// Create message consumer
import solace = require("solclientjs");
import { delay } from "./utils/delay.js";
import { url } from "./utils/baseUrl.js";
import { getQueue } from "./semp/getQueue.js";
import { createBridge } from "./semp/createBridge.js";
import { createRemoteBridge } from "./semp/createRemoteBridge.js";

let receivedCount = 0;

const factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

const session1 = solace.SolclientFactory.createSession({
  url: "tcp://10.0.0.57:55555",
  vpnName: "default",
  userName: "admin",
  password: "admin",
});
session1.connect();
session1.on(solace.SessionEventCode.UP_NOTICE, async () => {
  const messageConsumer = session1.createMessageConsumer({
    queueDescriptor: { name: "testing", type: solace.QueueType.QUEUE },
    acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT,
  });
  messageConsumer.connect();

  messageConsumer.on(solace.MessageConsumerEventName.UP, function () {
    console.log("=== Ready to receive messages from broker 1. ===");
  });
  messageConsumer.on(solace.MessageConsumerEventName.DOWN, function () {
    console.log("=== DOWN! ===");
  });
  messageConsumer.on(
    solace.MessageConsumerEventName.CONNECT_FAILED_ERROR,
    function () {
      console.log("CONNECT_FAILED_ERROR");
    }
  );

  let loopCounter = 0;
  messageConsumer.on(
    solace.MessageConsumerEventName.MESSAGE,
    async (message) => {
      receivedCount++;
      loopCounter++;
      console.log('Received message: "' + message.getBinaryAttachment());
      if (loopCounter === 1) {
        loopCounter = 0;
        message.acknowledge();
        messageConsumer.stop();
        await delay(1000);

        //Check for number of messages in queue.
        const queue = await getQueue(url("8080", "monitor"));
        if (queue.data.collections.msgs.count >= 200) {
          console.log(
            `Queue size is now 200. Setting up a bridge between the two brokers.\n`
          );
          session1.disconnect();
        } else {
          messageConsumer.start();
        }
      }
    }
  );
});

session1.on(solace.SessionEventCode.DISCONNECTED, async () => {
  await delay(5000);
  const session2 = solace.SolclientFactory.createSession({
    url: "tcp://10.0.0.57:55556",
    vpnName: "default",
    userName: "admin",
    password: "admin",
  });
  session2.connect();
  session2.on(solace.SessionEventCode.UP_NOTICE, async () => {
    console.log(`=== CONNECTED TO BROKER 2 ===`);
    const messageConsumer2 = session2.createMessageConsumer({
      queueDescriptor: { name: "testing", type: solace.QueueType.QUEUE },
      acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT,
    });
    messageConsumer2.connect();

    messageConsumer2.on(solace.MessageConsumerEventName.UP, async function () {
      console.log("=== Ready to receive messages from broker 2. ===");
      const bridge1 = await createBridge(url("8080", "config"));
      const bridge2 = await createBridge(url("8081", "config"));
      if (bridge1.status === 200 && bridge2.status === 200) {
        const remoteBridge1 = await createRemoteBridge(
          url("8080", "config"),
          "55556"
        );
        const remoteBridge2 = await createRemoteBridge(
          url("8081", "config"),
          "55555"
        );
        if (remoteBridge1.status === 200 && remoteBridge2.status === 200) {
          console.log(`Bridges created successfully`);
        }
      }
    });

    let loopCounter = 0;
    messageConsumer2.on(
      solace.MessageConsumerEventName.MESSAGE,
      async (message) => {
        receivedCount++;
        loopCounter++;
        console.log('Received message: "' + message.getBinaryAttachment());
        message.acknowledge();
      }
    );
  });
});

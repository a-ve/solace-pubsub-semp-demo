import solace = require("solclientjs");
import { url } from "./utils/baseUrl.js";
import { createQueue } from "./semp/createQueue.js";
import { createSubscription } from "./semp/createSubscription.js";
import { delay } from "./utils/delay.js";
import { getQueue } from "./semp/getQueue.js";

let messageCounter = 1;

//Queue in broker 1
const queue = await createQueue(url("8080", "config"));

//Subscription for the queue in broker 1
const subscription = await createSubscription(url("8080", "config"));

const factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;

//We need to init the client only after the queue is setup
if (queue.status === 200 && subscription.status === 200) {
  console.log(`Queue created, run the Consumer`);
  await delay(5000);

  solace.SolclientFactory.init(factoryProps);
}

//First session
const session1 = solace.SolclientFactory.createSession({
  url: "tcp://10.0.0.57:55555",
  vpnName: "default",
  userName: "admin",
  password: "admin",
});
session1.connect();
let ackCount = 0;

//Publish 10 messages, wait one second.
session1.on(solace.SessionEventCode.UP_NOTICE, async () => {
  console.log(`Connected to Broker 1!`);
  let delayCounter = 0;
  while (true) {
    publish(messageCounter, session1);
    delayCounter++;
    messageCounter++;

    if (delayCounter === 10) {
      delayCounter = 0;
      await delay(1000);

      const queue = await getQueue(url("8080", "monitor"));
      console.log(`spool size: ${queue.data.collections.msgs.count}`);
      if (queue.data.collections.msgs.count > 200) {
        console.log(
          `Queue size is now greater than 200. Setting up a queue in the second broker.\n`
        );
        //Queue in broker 2
        const queue = await createQueue(url("8081", "config"));

        //Subscription for the queue in broker 2
        const subscription = await createSubscription(url("8081", "config"));

        if (queue.status === 200 && subscription.status === 200) {
          console.log(
            `Queue has been setup in the second broker, disconnecting from broker 1`
          );
          session1.disconnect();
          return;
        }
      }
    }
  }
});

session1.on(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE, (sessionEvent) => {
  console.log(
    "Delivery of message with correlation key = " +
      JSON.stringify(sessionEvent.correlationKey) +
      " confirmed."
  );
  ackCount++;
});

const publish = async (count: number, session: solace.Session) => {
  console.log(`Publishing message ${count}`);
  // const randomBuffer = new Uint32Array(1000000);

  const messageText = `Message ${count}`;
  const message = solace.SolclientFactory.createMessage();
  1;
  message.setCorrelationKey(count.toString());
  message.setDestination(
    solace.SolclientFactory.createTopicDestination("subtest")
  );
  message.setBinaryAttachment(messageText);
  message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
  session.send(message);
};

session1.on(solace.SessionEventCode.DISCONNECTED, () => {
  const session2 = solace.SolclientFactory.createSession({
    url: "tcp://10.0.0.57:55556",
    vpnName: "default",
    userName: "admin",
    password: "admin",
  });
  session2.connect();
  session2.on(solace.SessionEventCode.UP_NOTICE, async () => {
    console.log(`Connected to Broker 2!`);
    let delayCounter = 0;
    while (true) {
      publish(messageCounter, session2);
      delayCounter++;

      if (delayCounter === 10) {
        console.log(
          `Sent 10 messages to the second queue. Disconnecting from Broker 2`
        );
        session2.disconnect();
        return;
      } else {
        messageCounter++;
      }
    }
  });
  session2.on(solace.SessionEventCode.DISCONNECTED, () => {
    console.log(`Total messages sent: ${messageCounter}`);
  });
});

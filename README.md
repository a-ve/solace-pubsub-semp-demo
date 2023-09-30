# Solace PubSub and SEMP demo
A simple explanation of the workflow (assume we have two solace brokers): 

###### Publisher:
1. Create a new queue and subscription on Broker 1 (let's refer them as Q1 and S1) using the SEMP config API.
2. In a loop, keep publishing messages to Q1 at the rate of 10 messages per second, all the while keeping track of the spool size of Q1 using the SEMP monitor API. 
3. After the spool size reaches a certain threshold, we stop publishing to Q1 and then create a new Queue and Subscription (with the same name) on Broker 2 (referred to as Q2 and S2).
4. We send ten new messages to Q2.

###### Consumer:
1. Simultaneously with step 1 from Publisher, we start a consumer which listens to Q1. It is rate-limited to consume 1 message per second. 
2. Just like the publisher, it also keeps track of how many messages are present in Q1. 
3. After a certain threshold is reached, we stop consuming from Q1 and start consuming from Q2. We create a new Bridge between Broker 1 and Broker 2. 
4. The spooled messages on Q1 are transferred via the bridge to Q2, where they are successfully consumed. 

#### How to run:
1. Run two Solace docker containers:
    - `docker run -d -p 8080:8080 -p 8008:8008 -p 55555:55555  --shm-size=2g --env username_admin_globalaccesslevel=admin --env username_admin_password=admin --name=solace1 solace/solace-pubsub-standard`
    - `docker run -d -p 8081:8080 -p 8009:8008 -p 55556:55555  --shm-size=2g --env username_admin_globalaccesslevel=admin --env username_admin_password=admin --name=solace2 solace/solace-pubsub-standard`
2. Run `npm install` and then `npm run build`
3. In two terminals, run `node run producer` and after you see the message "Run the consumer" on terminal one, run `node run consumer` in terminal two. 
4. Match the number of messages sent in both the consumer and producer terminal windows. 

Note: Please make sure the Solace endpoints and spool threshold are set. Currently they're hardcoded to `10.0.0.57` and `200`, respectively.
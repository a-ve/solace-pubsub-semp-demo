import axios from "axios";

export const createSubscription = async (baseUrl: string) => {
  return await axios.post(
    baseUrl + "msgVpns/default/queues/testing/subscriptions",
    {
      msgVpnName: "default",
      queueName: "testing",
      subscriptionTopic: "subtest",
    },
    {
      auth: {
        username: "admin",
        password: "admin",
      },
    }
  );
};

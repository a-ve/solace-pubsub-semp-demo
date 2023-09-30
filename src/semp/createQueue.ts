import axios from "axios";

export const createQueue = async (baseUrl: string) => {
  return await axios.post(
    baseUrl + "msgVpns/default/queues",
    {
      accessType: "exclusive",
      egressEnabled: true,
      ingressEnabled: true,
      msgVpnName: "default",
      permission: "consume",
      queueName: "testing",
    },
    {
      auth: {
        username: "admin",
        password: "admin",
      },
    }
  );
};

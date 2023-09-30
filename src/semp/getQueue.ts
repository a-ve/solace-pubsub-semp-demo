import axios from "axios";

export const getQueue = async (baseUrl: string) => {
  return await axios.get(baseUrl + "msgVpns/default/queues/testing", {
    auth: {
      username: "admin",
      password: "admin",
    },
  });
};

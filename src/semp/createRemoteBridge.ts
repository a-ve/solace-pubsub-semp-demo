import axios from "axios";

export const createRemoteBridge = async (baseUrl: string, port: string) => {
  return await axios.post(
    baseUrl + "msgVpns/default/bridges/sempbridge,auto/remoteMsgVpns",
    {
      bridgeName: "sempbridge",
      bridgeVirtualRouter: "auto",
      clientUsername: "admin",
      connectOrder: 1,
      enabled: true,
      msgVpnName: "default",
      password: "admin",
      queueBinding: "testing",
      remoteMsgVpnLocation: `10.0.0.57:${port}`,
      remoteMsgVpnName: "default",
    },
    {
      auth: {
        username: "admin",
        password: "admin",
      },
    }
  );
};

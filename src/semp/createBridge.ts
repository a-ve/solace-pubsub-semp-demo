import axios from "axios";

export const createBridge = async (baseUrl: string) => {
  return await axios.post(
    baseUrl + "msgVpns/default/bridges",
    {
      bridgeName: "sempbridge",
      bridgeVirtualRouter: "auto",
      enabled: true,
      msgVpnName: "default",
      remoteAuthenticationBasicClientUsername: "admin",
      remoteAuthenticationBasicPassword: "admin",
      remoteAuthenticationScheme: "basic",
    },
    {
      auth: {
        username: "admin",
        password: "admin",
      },
    }
  );
};

const solace = require("solclientjs");

class SolaceClient {
  constructor(config) {
    const factoryProps = new solace.SolclientFactoryProperties();
    factoryProps.profile = solace.SolclientFactoryProfiles.version10;
    solace.SolclientFactory.init(factoryProps);

    this.sessionProperties = {
      url: config.hostUrl,
      vpnName: config.vpnName,
      userName: config.userName,
      password: config.password,
    };

    this.session = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.session = solace.SolclientFactory.createSession(
          this.sessionProperties
        );

        this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
          console.log("=== Connected to Solace PubSub+ ===");
          resolve();
        });

        this.session.on(
          solace.SessionEventCode.CONNECT_FAILED_ERROR,
          (sessionEvent) => {
            const error = `Connection failed: ${sessionEvent.infoStr}`;
            console.error(error);
            reject(new Error(error));
          }
        );

        this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
          console.log("Disconnected from Solace PubSub+");
        });

        this.session.connect();
      } catch (error) {
        console.error("Error connecting to Solace PubSub+:", error);
        reject(error);
      }
    });
  }

  publish(topic, message) {
    if (!this.session) {
      console.error("Not connected to Solace PubSub+");
      return;
    }

    try {
      const msg = solace.SolclientFactory.createMessage();
      msg.setDestination(solace.SolclientFactory.createTopicDestination(topic));
      msg.setBinaryAttachment(JSON.stringify(message));
      msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
      this.session.send(msg);
      console.log(`Published message to topic: ${topic}`);
    } catch (error) {
      console.error("Error publishing message:", error);
    }
  }

  disconnect() {
    if (this.session) {
      try {
        this.session.disconnect();
        console.log("Disconnected from Solace PubSub+");
      } catch (error) {
        console.error("Error disconnecting from Solace PubSub+:", error);
      }
    }
  }
}

module.exports = SolaceClient;

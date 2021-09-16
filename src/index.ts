import { ConfigLoader } from "./ConfigLoader";
import { StreamElementsConnexion } from "./StreamElementsConnexion";

const main = async () => {
  const configLoader = new ConfigLoader();
  await configLoader.load();

  const conf = configLoader.getConfig();

  if (!Array.isArray(conf.config)) {
    if (!conf.config.name) {
      conf.config.name = "streamelements";
    }
    new StreamElementsConnexion(conf.host, conf.port, conf.config);
  } else {
    conf.config.forEach((value, index) => {
      if (!value.name) {
        value.name = `streamelements-${index + 1}`;
      }
      new StreamElementsConnexion(conf.host, conf.port, value);
    });
  }
};

main();

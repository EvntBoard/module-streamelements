# StreamElements for EvntBoard

⚠️ Not functional for the moment ⚠

Doc : https://dev.streamelements.com/docs/kappa/docs/Websockets.md

## Config

```json5
{
  "host": "localhost", // EvntBoard HOST (optionnal)
  "port": 5001, // Evntboard PORT (optionnal)
  "config": {
    "name": "streamelements", // if no name is provided default value is "streamelements" (optionnal)
    "token": "mySuperAccessToken"
  }
}
```

## Multiple config

Name property should be different :)

```json5
{
  "host": "localhost", // EvntBoard HOST (optionnal)
  "port": 5001, // Evntboard PORT (optionnal)
  "config": [
    {
      "name": "streamelements-mainaccount", // if no name is provided default value is "streamelements-1" (optionnal)
      "token": "mySuperAccessToken"
    },
    {
      "name": "streamelements-secondaccount", // if no name is provided default value is "streamelements-2" (optionnal)
      "token": "mySuperSecondAccessToken"
    }
  ]
}
```

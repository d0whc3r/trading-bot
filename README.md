# Trading bot
Trading bot

## Install

```bash
yarn install
```

## Run

First, rename `example.env` to `.env` and fill the information correctly

```bash
yarn start
```

## Usage

Bot is listening at port `PORT` and waiting for post in `MAIN_PATH`, the format of the post data is in `content/model-old.json`

The bot will place and order for every post request

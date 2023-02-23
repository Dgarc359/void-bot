
import * as commands from '../lib/commands';
import axios from 'axios';
import {config} from './config'

const { BAN_BOT_APPLICATION_ID, BAN_BOT_TOKEN } = await config();

const url = `https://discord.com/api/v10/applications/${BAN_BOT_APPLICATION_ID}/commands`;

const headers = {
  Authorization: `Bot ${BAN_BOT_TOKEN}`,
  'Content-Type': 'application/json',
};

// console.debug(command);

export const registerCommands = () => {
  Object.keys(commands).map(async(e) => {
    await axios
      //@ts-ignore
      .post(url, JSON.stringify(commands[e]), {
        headers: headers,
      })
      .then((e) => {
        console.log(e.status, e.data);
      })
      .catch(err => { throw new Error(err)});
  });
}

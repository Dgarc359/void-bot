import {ssmCredentials} from './ssm'

type Config = {
  BAN_BOT_APPLICATION_ID: string,
  BAN_BOT_TOKEN: string;
}

export const config = async (): Promise<Config> => {
  const {BAN_BOT_APPLICATION_ID, BAN_BOT_TOKEN} = 
    await ssmCredentials(['BAN_BOT_APPLICATION_ID', 'BAN_BOT_TOKEN']);

  if (!BAN_BOT_APPLICATION_ID || !BAN_BOT_TOKEN) throw new Error('Error retrieving creds')

  return {
    BAN_BOT_APPLICATION_ID: BAN_BOT_APPLICATION_ID,
    BAN_BOT_TOKEN: BAN_BOT_TOKEN,
  }
}

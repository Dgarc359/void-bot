import { ApiHandler } from "sst/node/api";
import { ssmCredentials } from "@ban-bot/core/ssm";
import {verifyDiscordRequest} from 'simple-discord-auth'
import aws from 'aws-sdk';

const ddb = new aws.DynamoDB();

const {BAN_BOT_PUBLIC_KEY} = await ssmCredentials(["BAN_BOT_PUBLIC_KEY"])
const BadRequest = {
  statusCode: 401,
  body: "Bad Request",
};

const InternalError = {
  statusCode: 500,
  body: "Internal Server Error"
}

type CommandTypes = 4;

export type DiscordCommandResponse = {
  type: CommandTypes;
  data: {
    content: string;
    flags?: number;
  }
}
type DiscordUser = {
  avatar: string,
  avatar_decoration: any, // can be null
  discriminator: string,
  id: string,
  public_flags: number,
  username: string
}
export type DiscordMember = {
  avatar: any, // can be null
  communication_disabled_until: any, // can be null
  deaf: boolean,
  flags: number,
  is_pending: boolean,
  joined_at: string,
  mute: boolean,
  nick: any, // can be null
  pending: boolean,
  permissions: string,
  premium_since: any, // can be null
  roles: string[],
  user: DiscordUser,
}
export type DiscordEventPayload = {
  app_permissions: string,
  application_id: string,
  channel_id: string,
  data: {
    id: string,
    name: string,
    options: {name: string, type: number, value: string}[],
    resolved: { members: any, users: {[name: string]: DiscordUser} },
    type: number
  },
  entitlement_sku_ids: any[],
  guild_id: string,
  guild_locale: string,
  id: string,
  locale: string,
  member: DiscordMember,
  token: string,
  type: number,
  version: number
}

export const handler = async (_evt: {body: any, headers: any}) => {
  if(!BAN_BOT_PUBLIC_KEY) return InternalError
  const {body, headers} = _evt;
  if(!body) return BadRequest;
  const isVerified = verifyDiscordRequest(body, headers, BAN_BOT_PUBLIC_KEY);
  if(!isVerified) return BadRequest;

  const parsedBody = JSON.parse(body);
  console.debug("parsed Body", parsedBody);
  const { type: kind, data, guild_id: guildId }: DiscordEventPayload = JSON.parse(body);

  if (kind === 1) {
    return {
      statusCode: 200,
      body: body,
    };
  } else if (kind === 2) {
    const { name } = data;
    if (!name) return BadRequest;
    console.log(data.options[0].value)
    console.log(data.resolved.users[data.options[0].value]);
    if (name === "void") {
      const uid = data.options[0].value;
      const params: aws.DynamoDB.UpdateItemInput = {
        TableName: process.env.DDB_TABLE!,
        Key: {
          'guildId': {
            S: guildId
          }
        },
        ExpressionAttributeNames: {
          "#uid": uid
        },
        ExpressionAttributeValues: {
          ":b": {
            N: "1"
          }
        },
        UpdateExpression: "ADD #uid :b",
        ReturnValues: "ALL_NEW"
      }

      const res = await ddb.updateItem(params).promise()
        .then((res) => res)
        .catch(err => console.error(err));

      console.log(res);
      if(!res || !res.Attributes) return InternalError
      const voidCount = res.Attributes[uid].N;
      const msg: DiscordCommandResponse = {
        type: 4,
        data: {
          content: `${data.resolved.users[data.options[0].value].username} has been tossed into the void ${Number(voidCount) == 1 ? voidCount + " time" : voidCount + " times"}!!`
        }
      }
      return msg
    } else {
      return BadRequest;
    }
  }
  return BadRequest;
};

import { StackContext, Api, Function, Table } from "sst/constructs";
import { AccountRootPrincipal, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { registerCommands } from "../packages/core/src/register";

export async function Stack({ stack, app }: StackContext) {
  registerCommands();

  const lambdaServicePrincipal = new ServicePrincipal(
    "lambda.amazonaws.com"
  );
  const lambdaServiceAssumedRole = new Role(
    stack,
    app.logicalPrefixedName('lambda-role'),
    {
      assumedBy: lambdaServicePrincipal,
      description: `Assume role for ${app.name} lambda service`
    }
  );

  const kmsPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "kms:Decrypt",
      "kms:Encrypt",
    ],
    resources: ["*"],
  });

  kmsPolicy.addCondition("StringLike", { "kms:RequestAlias": "alias/aws/ssm"});

  lambdaServiceAssumedRole.addToPolicy(kmsPolicy);

  lambdaServiceAssumedRole.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "ssm:GetParameters",
      "ssm:GetParameter",
      "ssm:GetParameterByPath"
    ],
    resources: ["*"]
  }));

  lambdaServiceAssumedRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
  );

  const bannedDdbTable = new Table(
    stack,
    app.logicalPrefixedName(`banned-ddb-table`),
    {
      fields: {
        guildId: "string",
      },
      primaryIndex: {
        partitionKey: "guildId"
      }
    }
  )

  const banBotFn = new Function(
    stack,
    app.logicalPrefixedName(`main-fn`),
    {
      functionName: app.logicalPrefixedName(`main-fn`),
      handler: `packages/functions/src/lambda.handler`,
      runtime: "nodejs16.x",
      role: lambdaServiceAssumedRole,
      url: true,
      permissions: [bannedDdbTable],
      environment: {
        DDB_TABLE: bannedDdbTable.tableName
      }
    }
  )
  stack.addOutputs({
    functionUrl: banBotFn.url ? banBotFn.url : ""
  })
}

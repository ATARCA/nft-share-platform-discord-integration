AWS Lambda function that queries dynamodb document database for new blockchain updates and updates discord channel about new tokens that have been minted on Talko platform.

Together with https://github.com/ATARCA/talko-dynamo-db-worker it forms a system where this dynamodb worker searches for new blockchain events via a public API, updates a dynamodb document database in AWS and allows other services such as AWS lambda social media integration scripts to consume blockchain information from document database.

For deployment of lambda function you can either utilize the included git workflow templates or check the official AWS documentation https://docs.aws.amazon.com/lambda/latest/dg/lambda-deploy-functions.html .

Discord webhook AWS lambda function implementation. Updates a channel where a webhook has been integrated with updates on latest token minting operations done in Talko Streamr contract.

Requirements:

- A Webhook needs to be created on discord platform
- A DynamoDB table where the latest blockheight is stored and updated to
- Thegraph graphQL API to token contract


- Env template
    - Webhook/bot access token
    - Webhook URL
    - AWS credentials

Discord webhook AWS lambda function implementation. Updates a channel where a webhook has been integrated with updates on latest token minting operations done in Talko Streamr contract.

Requirements:

- A Webhook needs to be created on discord platform
- A DynamoDB table where the latest blockheight is stored and updated to
- Thegraph graphQL API to token contract


- Env template
    - Webhook/bot access token
    - Webhook URL
    - AWS credentials

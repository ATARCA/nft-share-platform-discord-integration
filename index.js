const { update } = require('lodash');

exports.handler = async (event, context) => {
    // load libraries
    require('dotenv').config();
    //use AWS secrets once refactored as a lambda function
    const AWS = require('aws-sdk')
    const { createClient, gql } = require('@urql/core')
    const fetch = require('node-fetch')
    const _ = require('lodash')
    const {WebhookClient, EmbedBuilder} = require('discord.js')

    const API_URL = process.env.API_URL
    const WEBHOOK_URL = process.env.WEBHOOK_URL
    const PROJECT = process.env.PROJECT
    const TEMPORARY_BLOCK_LIMIT = process.env.TEMPORARY_BLOCK_LIMIT
    const TABLE_NAME = process.env.TABLE_NAME
    //Todo: rename temporary block limit to something more representative, e.g. last block checked
    //Retrieve last block checked from database
    
    console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))

    const webhookClient = new WebhookClient({url: WEBHOOK_URL})
    const aws_remote_config = {
        accessKeyId: process.env.AWS_ACCESS_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.REGION
    }

    AWS.config.update(aws_remote_config)
    const client = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})

    const params = {
        TableName: TABLE_NAME,
        Key: {"id":"production-blockheight"}
    }

    function updateParams(latestMintBlock){
        return  {
            TableName: TABLE_NAME,
            Key: {"id":"production-blockheight"},
            UpdateExpression: 'set blockheight = :v',
            ExpressionAttributeValues: {
                ':v': _.parseInt(latestMintBlock)
            }
        }
    }

    async function getItem() {
        try {
            const data = await client.get(params).promise()
            return data.Item
        } catch (err) {
            return err
        }
    }

    async function updateItem(params) {
        try {
            const data = await client.update(params).promise()
            console.log("Success", data)
        } catch(err) {
            console.log("Error", err)
        }
    }

    const projectSpecificTokens = gql`
        query TokenQuery($project: String!) {
            tokens(orderBy: mintBlock, orderDirection: asc, where: {project: $project}) {
                tokenId
                contractAddress
                isLikeToken
                metadataUri
                mintBlock
                ownerAddress
                isOriginal
                isSharedInstance
                parentTokenId
                project {
                    id
                }
                category {
                    id
                }
            }
        }
    `

    async function getMetadataObject(metadataUri) {
        try {
            //console.log('attempting to fetch url', metadataUri)
            const response = await fetch(metadataUri)
            return response
        } catch(error) {
            console.log('Failed to retrieve metadata from metadataurl', error)
        } 
    }

    //Webhook initialization
    async function main() {

        //fetch blockheight from dynamodb
        //if blockgheight not set, use default blockheight
        const item = await getItem()
        console.log('receivedblockheight from dynamodb', item?.blockheight)
        const blockheight = 'blockheight' in item ? item.blockheight : TEMPORARY_BLOCK_LIMIT;
        console.log('Attempting to fetch tokens starting from Blockheight: ', blockheight)
        const graphQLClient = createClient({
            url: API_URL,
            fetch: fetch,
        })
        
        //Todo: update query to include blockheight as parameter
        const data = await graphQLClient.query(projectSpecificTokens, {project: PROJECT}).toPromise()
        
        //find latest mintBlock 

        const latestMintBlockObject = _.maxBy(data?.data?.tokens, function(o){
            return _.parseInt(o.mintBlock)
        })

        const latestMintBlock = latestMintBlockObject?.mintBlock
        
        //filter out all tokens that are newer than the last checked mintblock
        const newTokens = _.filter(data?.data?.tokens, function(o) {
            return _.parseInt(o.mintBlock) > blockheight
        })

        //filter out all tokens that are original or shared awards
        const origOrShared = _.filter(newTokens, function(o) {
            return o.isOriginal || o.isSharedInstance
        })

        console.log('New tokens',origOrShared)
        
        
        //each discord update is done asynchronously, the order or updates is not guaranteed
        //then update the params
        return Promise.all(_.map(origOrShared, async function(object) {
            //await parseAndPostToChannel(token)
            const talkoTokenURI = 'https://talkoapp.io/token/' + object?.contractAddress + '/' + object?.tokenId
            const metadataUri = object.metadataUri
            const metadataResponse = await getMetadataObject(metadataUri)
            const tokenType = object?.isOriginal ? 'Original Award' : (object?.isSharedInstance ? 'Shared Award' : 'Like');
            const embed = new EmbedBuilder()
            if (metadataResponse?.ok) {
                const data = await metadataResponse.json();
                embed
                .setTitle('New award token has been minted')
                .setColor(0x00FFFF)
                .setURL(data?.image)
                .setDescription(data?.name)
                .setThumbnail(data?.image)
                .addFields(
                    { name: 'Receiver', value: object?.ownerAddress },
                    { name: 'Award Category', value: object?.category?.id },
                    { name: 'Token Type', value: tokenType },
                    { name: 'Mint block', value: object?.mintBlock },
                    { name: 'Link', value: '[Talkoapp.io]('+talkoTokenURI+')' }
                )
            }
            
            const metadataAvailable = metadataResponse.status == 200 ? true : false;
            const metadataNotAvailable = 'Award receiver has not yet consented the publication of the metadata. If this is your award, please check your consent options on talkopp.io for the receiving wallet.'
            const embedNoMetadata = new EmbedBuilder()
                .setTitle('New award token has been minted')
                .setDescription(metadataNotAvailable)
                .addFields(
                    { name: 'Receiver', value: object?.ownerAddress },
                    { name: 'Token Type', value: tokenType },
                    { name: 'Mint block', value: object?.mintBlock },
                    { name: 'Link', value: '[Talkoapp.io](https://talkoapp.io/)' }
                )

            return await webhookClient.send({
                content: '',
                username: 'Talko-Bot',
                avatarURL: 'https://images.talkoapp.io/discord_bot_1.png',
                embeds: metadataAvailable ? [embed] : [embedNoMetadata]

            })
        }))
        .then(
            updateItem(updateParams(latestMintBlock))
        )
    }

    await main()
};
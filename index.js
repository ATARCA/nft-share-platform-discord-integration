// load libraries
require('dotenv').config();
//use AWS secrets once refactored as a lambda function
const AWS = require('aws-sdk')
const { createClient, gql } = require('@urql/core')
const fetch = require('node-fetch')
const _ = require('lodash')
const Discord = require('discord.js')
const {Client, Events, GatewayIntentBits, WebhookClient, EmbedBuilder} = require('discord.js')

const APIURL = process.env.APIURL
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const WEBHOOK_URL = process.env.WEBHOOK_URL
const PROJECT = process.env.PROJECT

const TEMPORARY_BLOCK_LIMIT = 36448364
//Todo: rename temporary block limit to something more representative, e.g. last block checked
//Retrieve last block checked from database

const projectSpecificTokens = gql`
    query TokenQuery($project: String!) {
        tokens(orderBy: mintBlock, orderDirection: desc, where: {project: $project}) {
            tokenId
            isLikeToken
            metadataUri
            mintBlock
            project {
                id
            }
        }
    }
`
//login to discord
//const client = new Discord.Client();
//client.login(BOT_TOKEN)

//try sending a message to a specific channel
// send new tokens in a message to a specific channel
// include image of nft to the message
// expand to allow commands on the bot




//Bot initialization
//Todo: separate bot to different lambda function
/*const client = new Client({intents: [GatewayIntentBits.Guilds]})

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`)
    testQuery()
    // client once update new messages
})

client.login(BOT_TOKEN)
*/
async function getMetadataObject(metadataUri) {
    const response = await fetch(metadataUri)
    return response
}

async function parseAndPostToChannel(object) {
    //Todo move client intilization outside the function, inefficient to keep initializing it
    const webhookClient = new WebhookClient({url: WEBHOOK_URL})
    const metadataUri = object.metadataUri
    const metadataResponse = await fetch(metadataUri)
    const data = await metadataResponse.json();
    //fetch metadata contents
    //if metadata has not yet been authorized to be shown, instruct the receiver to head to platform to show it

    const embed = new EmbedBuilder()
        .setTitle('New token has been minted')
        .setColor(0x00FFFF)
        .setURL(data?.image)
        .setDescription(data?.name)
        .setImage(data?.image)
        .setThumbnail(data?.image)
        .addFields(
            { name: 'Field 1', value: 'Value 1' },
            { name: 'Field 2', value: 'Value 2' },
        )

    try {
        webhookClient.send({
            content: 'Webhook test',
            username: 'Talko-Bot',
            avatarURL: 'https://i.imgur.com/AfFp7pu.png',
            embeds: [embed],
        });
    } catch(error) {
        console.log('Failed to send update to channel', error)
    }
}

//Webhook initialization


//try catch sending the msg, succesful update dynamodb


// to be refactored as a periodically executed aws lambda function

//check from cache what was the latest token if any, what was the latest mintblock checked, check if any new tokens minted since then
//consider aws dynamodb as a cache

//check if there are new tokens for streamr project


// if there is a new token send it to discord bot


async function main() {
    const client = createClient({
        url: APIURL,
        fetch: fetch,
      })
      
    const data = await client.query(projectSpecificTokens, {project: PROJECT}).toPromise()
    
    //filter out all tokens that are newer than the last checked mintblock
    const newTokens = _.filter(data?.data?.tokens, function(o) {
        return _.parseInt(o.mintBlock) > TEMPORARY_BLOCK_LIMIT
    })

    console.log(newTokens)

    _.forEach(newTokens, function(token) {
        parseAndPostToChannel(token)
    })


    //push new token information as message to discord bot
    //update checked block limit with a new block number, last item on the list is the highest last check block 
}

main()
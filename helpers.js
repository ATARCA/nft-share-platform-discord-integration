//Helper functions and constants for talko webhook
require('dotenv').config();
const {gql} = require('@urql/core')
const fetch = require('node-fetch')
const _ = require('lodash')

const TABLE_NAME = process.env.TABLE_NAME

const params = {
    TableName: TABLE_NAME,
    Key: {"id":"production-blockheight"}
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
        const response = await fetch(metadataUri)
        return response
    } catch(error) {
        console.log('Failed to retrieve metadata from metadataurl', error)
    } 
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

async function getItem(client) {
    try {
        const data = await client.get(params).promise()
        return data.Item
    } catch (err) {
        return err
    }
}

async function updateItem(client, latestMintBlock) {
    const updatedParams = updateParams(latestMintBlock)
    try {
        const data = await client.update(params).promise()
        console.log("Success", data)
    } catch(err) {
        console.log("Error", err)
    }
}

module.exports = {projectSpecificTokens, getMetadataObject, updateParams, getItem, updateItem}
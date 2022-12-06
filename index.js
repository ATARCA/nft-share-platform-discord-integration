// load libraries
const AWS = require('aws-sdk')
const { createClient, gql } = require('@urql/core')
const fetch = require('node-fetch')
const _ = require('lodash')

const APIURL = 'https://api.thegraph.com/subgraphs/name/atarca/talko'

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

async function testQuery() {
    const client = createClient({
        url: APIURL,
        fetch: fetch,
      })
      
    const data = await client.query(projectSpecificTokens, {project: 'Streamr'}).toPromise()
    
    //filter out all tokens that are newer than the last checked mintblock
    const newTokens = _.filter(data?.data?.tokens, function(o) {
        return _.parseInt(o.mintBlock) > TEMPORARY_BLOCK_LIMIT
    })

    console.log(newTokens)

    //push new token information as message to discord bot
    //update checked block limit with a new block number, last item on the list is the highest last check block 
}

testQuery()


// to be refactored as a periodically executed aws lambda function

//check from cache what was the latest token if any, what was the latest mintblock checked, check if any new tokens minted since then
//consider aws dynamodb as a cache

//check if there are new tokens for streamr project


// if there is a new token send it to discord bot

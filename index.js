// load libraries
const AWS = require('aws-sdk')
const { createClient, gql } = require('@urql/core')
//const fetch = require('unfetch')
const fetch = require('node-fetch')
//import { createClient } from 'urql'

const APIURL = 'https://api.thegraph.com/subgraphs/name/atarca/talko'

const tokensQueryQGL = gql`
    query {
        tokens {
            tokenId
            isLikeToken
            metadataUri
        }
    }
`

const projectSpecificTokens = gql`
    query TokenQuery($project: String!) {
        tokens(project: $project) {
            tokenId
            isLikeToken
            metadataUri
        }
    }
`

async function testQuery() {
    const client = createClient({
        url: APIURL,
        fetch: fetch,
      })
      
    const data = await client.query(tokensQueryQGL).toPromise()
    console.log(data?.data?.tokens)
}

testQuery()


// to be refactored as a periodically executed aws lambda function

//check from cache what was the latest token if any
//consider aws dynamodb as a cache

//check if there are new tokens for streamr project


// if there is a new token send it to discord bot

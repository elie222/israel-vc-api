import { parse } from 'url'
import { google, sheets_v4 } from 'googleapis'
// this breaks `googleapis` when using import syntax for some reason
const credentials = require('./credentials.json')

const SPREADSHEET_ID = process.env.SPREADSHEET_ID

const getClient = ({ scopes }) => {
  return google.auth.getClient({ credentials, scopes })
}

const authorizeSheets = async () => {
  const client = await getClient({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({
    version: 'v4',
    auth: client,
  })
}

const readCol = async (sheets: sheets_v4.Sheets, range) => {
  return new Promise<any>((resolve, reject) => {
    sheets.spreadsheets.values.get(
      {
        spreadsheetId: SPREADSHEET_ID,
        range,
      },
      (err, response) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      }
    )
  })
}

export default async function(req, res) {
  const {
    query: { start = 2, end = 21 },
  } = parse(req.url, true)

  const sheets = await authorizeSheets()

  const sheetsData = await readCol(sheets, `Sheet1!A${start}:G${end}`)

  const {
    data: { values },
  } = sheetsData

  // console.log(values)

  res.setHeader('Access-Control-Allow-Origin', '*')
  // https://zeit.co/docs/v2/deployments/concepts/cdn-and-global-distribution/
  // https://zeit.co/blog/serverless-pre-rendering
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=3600, max-age=0')

  res.end(JSON.stringify(values))
}

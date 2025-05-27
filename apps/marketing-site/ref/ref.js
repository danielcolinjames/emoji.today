const { fetchEventLogsByAddress } = require('./fetchEventLogsByAddress')
const baseScanApiKey = process.env.BASESCAN_API_KEY

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = []

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

async function processCSV(filePath) {
  try {
    const data = await parseCSV(filePath)
    // console.log('CSV Data:', data);
    const publishTxnHashes = getPublishTransactionHashes(data)
    console.log(`${publishTxnHashes.length} Publish txn hashes`)
    // Process data or perform further actions
  } catch (error) {
    console.error('Error parsing CSV:', error)
  }
}

// Replace 'path/to/your/file.csv' with the actual path to your CSV file

function getPublishTransactionHashes(results) {
  const publishMethodName = 'Publish'
  // console.log(results[0])
  const hashes = results.filter(tx => tx.Method === publishMethodName).map(tx => tx.Txhash)
  console.log(hashes.length)
  console.log(hashes[0])
  return hashes
}

async function batchProcess(array, batchSize, processFunction) {
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize)
    await Promise.all(batch.map(item => processFunction(item)))
  }
}

processCSV('./all-txns.csv')

const json = {
  name: 'FLYBAR: Friends & Family',
  description: '',
  image: 'https://images.blackbird.xyz/b57e54a3-73d3-4f70-9e04-ba8c0a756db3/343_490.png',
  attributes: [
    { trait_type: 'accessLevel', value: 3 },
    { trait_type: 'artist', value: 'Andrew Braswell' },
    { trait_type: 'expirationDate', value: 0, display_type: 'date' },
    { trait_type: 'generation', value: 1 },
    { trait_type: 'memberStatus', value: 'Friends & Family' },
    { trait_type: 'mintDate', value: 0, display_type: 'date' },
    { trait_type: 'restaurantLocations', value: 'FLYBAR, 324 Lafayette St, Floor 6, New York, NY 10012' },
    { trait_type: 'restaurantName', value: 'FLYBAR' },
  ],
}

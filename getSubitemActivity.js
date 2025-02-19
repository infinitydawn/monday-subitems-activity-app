import mondaySdk from "monday-sdk-js";
const monday = mondaySdk()
import { writeFileSync } from 'fs';
import { Parser } from 'json2csv';


monday.setToken("")


let query =
    `
query {  
  boards (ids: 4088017851) {
    activity_logs (from: "2025-01-01T00:00:00Z", to: "2025-01-31T23:59:59Z", column_ids: ["numbers4","dup__of_payment_1","numeric","dup__of_payment_3","dup__of_payment_4"]) {
      id
      event
      data
      created_at
    }
  }
}`

const fetchSubitemsActivity = async () => {
    try {
        const res = await monday.api(query);

        const jsonData = await res.data.boards[0].activity_logs.map(obj => {
            let newJson = JSON.parse(obj.data)
            newJson["id"] = obj.id;
            newJson["event"] = obj.event;
            newJson["created_at"] = obj.created_at;

            return newJson;
        })
        // console.log(jsonData)
        const parentsIds = await jsonData.map(obj => obj.parent_item_id)
        const uniqueParents = await [... new Set(parentsIds)]
        const parentsHashtable = await getParentsNames(uniqueParents)

        await jsonData.forEach(obj => {
            obj["parentName"] = parentsHashtable[obj.parent_item_id]
        })
        console.log(jsonData)
        // console.log(parentsNames)
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(jsonData);

        writeFileSync('output.csv', csv, 'utf8');
    } catch (error) {
        console.error("Error:", error);
    }
}


fetchSubitemsActivity();

// monday.api(query).then(res => {
//     let data = res.data.boards[0].activity_logs.map(obj => JSON.parse(obj.data))
//     return data.map(obj => {
//         return {
//             "subitem_name": obj.pulse_name,
//             "parent_name": "None",
//             "parent_id": obj.parent_item_id
//         }
//     })
// }).then(newData => {

//     const hashTable = new Map();
//     let parentsIds = newData.map(obj => obj.parent_id)
//     const uniqueParents = [... new Set(parentsIds)]
//     console.log(uniqueParents)

//     let parentObjects = getParentsNames(parentsIds)
//     return {
//         parentObjects,
//         newData
//     }

// }).then(obj => {
//     console.log(obj)
// })





async function getParentsNames(parentsIds) {
    // console.log(parentsIds)
    let query =
        `query {  
                items (ids: [${parentsIds}]) {
                    name
                    id
                }
            
        }`
    // console.log(query)
    const res = await monday.api(query);
    const items = res.data.items;

    const hashTable = {}

    await items.forEach(element => {
        hashTable[element.id] = element.name
    });

    return hashTable;
}


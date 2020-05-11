const DB = require('../../db.js')
const log = require('tangy-log').log
const clog = require('tangy-log').clog
const {promisify} = require('util');
const fs = require('fs');
const readFile = promisify(fs.readFile);
const tangyModules = require('../index.js')()

module.exports = {
  hooks: {
    clearReportingCache: async function(data) {
      const { groupNames } = data
      for (let groupName of groupNames) {
        console.log(`removing db ${groupName}-synapse`)
        const db = new DB(`${groupName}-synapse`)
        await db.destroy()
      }
      return data
    },
    reportingOutputs: function(data) {
      return new Promise(async (resolve, reject) => {
        const {doc, sourceDb} = data
        const locationList = JSON.parse(await readFile(`/tangerine/client/content/groups/${sourceDb.name}/location-list.json`))
        let synapseDb
        try {
          synapseDb = await new DB(`${sourceDb.name}-synapse`);
        } catch (e) {
          console.log("Error creating db: " + JSON.stringify(e))
        }
        if (doc.form.id === 'user-profile') {
          await saveData({...doc, type : "user-profile"}, locationList, {}, sourceDb, resolve);
        } else {
          if (doc.type === 'case') {

            // output case
            await pushResponse(doc, synapseDb);
            // await saveData(doc, locationList, {}, sourceDb, resolve);

            let numInf = getItemValue(doc, 'numinf')
            let participant_id = getItemValue(doc, 'participant_id')

            // output participants
            for (const participant of doc.participants) {
              await pushResponse({...participant, _id: participant.id, caseId: doc._id, numInf: participant.participant_id === participant_id ? numInf : '', type: "participant"}, synapseDb);
            }

            // output case-events
            for (const event of doc.events) {
              await pushResponse({...event, _id: event.id, type : "case-event"}, synapseDb)

              // output event-forms
              for (const eventForm of event['eventForms']) {
                try {
                  await pushResponse({type : "event-form" }, synapseDb);
                } catch (e) {
                  if (e.status !== 404) {
                    console.log("Error processing eventForm: " + JSON.stringify(e) + " e: " + e)
                  }
                }
              }
            }
          } else {
            let flatResponse = await generateFlatResponse(doc, locationList);
            await saveData({...doc, type : "form-response"}, flatResponse, sourceDb, resolve);
            // resolve(data)
          }
        }
      })
    }
  }
}

const getItemValue = (doc, variableName) => {
  const variablesByName = doc.items.reduce((variablesByName, item) => {
    for (const input of item.inputs) {
      variablesByName[input.name] = input.value;
    }
    return variablesByName;
  }, {});
  return variablesByName[variableName];
};

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

/** This function processes form response for csv.
 *
 * @param {object} formData - form response from database
 * @param {object} locationList - location list doing label lookups on TANGY-LOCATION inputs
 *
 * @returns {object} processed results for csv
 */

const generateFlatResponse = async function (formResponse, locationList) {
  if (formResponse.form.id === '') {
    formResponse.form.id = 'blank'
  }
  let flatFormResponse = {
    _id: formResponse._id,
    formId: formResponse.form.id,
    formTitle: formResponse.form.title,
    startUnixtime: formResponse.startUnixtime,
    buildId: formResponse.buildId||'',
    buildChannel: formResponse.buildChannel||'',
    deviceId: formResponse.deviceId||'',
    groupId: formResponse.groupId||'',
    complete: formResponse.complete
  };
  function set(input, key, value) {
    flatFormResponse[key] = input.skipped
      ? process.env.T_REPORTING_MARK_SKIPPED_WITH
      : input.hidden && process.env.T_REPORTING_MARK_DISABLED_OR_HIDDEN_WITH !== "ORIGINAL_VALUE"
        ? process.env.T_REPORTING_MARK_DISABLED_OR_HIDDEN_WITH 
        : value
  }
  for (let item of formResponse.items) {
    for (let input of item.inputs) {
      // Simplify the keys by removing formID.itemId
      let firstIdSegment = ""
      if (input.tagName === 'TANGY-LOCATION') {
        // Populate the ID and Label columns for TANGY-LOCATION levels.
        locationKeys = []
        for (let group of input.value) {
          set(input, `${firstIdSegment}${input.name}.${group.level}`, group.value)
          locationKeys.push(group.value)
          try {
            const location = getLocationByKeys(locationKeys, locationList)
            for (let keyName in location) {
              if (keyName !== 'children') {
                set(input, `${firstIdSegment}${input.name}.${group.level}_${keyName}`, location[keyName])
              }
            }
          } catch(e) {
            set(input, `${firstIdSegment}${input.name}.${group.level}_label`, 'orphaned')
          }
        }
      } else if (input.tagName === 'TANGY-GPS') {
        set(input, `${firstIdSegment}geoip.location.lat`, input.value.latitude)
        set(input, `${firstIdSegment}geoip.location.lon`, input.value.longitude)
        // Flatter...
        set(input, `geoip.lat`, input.value.latitude)
        set(input, `geoip.lon`, input.value.longitude)

      } else if (input.tagName === 'TANGY-TIMED') {
        set(input, `${firstIdSegment}${input.name}.duration`, input.duration)
        set(input, `${firstIdSegment}${input.name}.time_remaining`, input.timeRemaining)
        // Calculate Items Per Minute.
        let numberOfItemsAttempted = input.value.findIndex(el => el.highlighted ? true : false) + 1
        let numberOfItemsIncorrect = input.value.filter(el => el.value ? true : false).length
        let numberOfItemsCorrect = numberOfItemsAttempted - numberOfItemsIncorrect
        set(input, `${firstIdSegment}${input.name}.number_of_items_correct`, numberOfItemsCorrect)
        set(input, `${firstIdSegment}${input.name}.number_of_items_attempted`, numberOfItemsAttempted)
        let timeSpent = input.duration - input.timeRemaining
        set(input, `${firstIdSegment}${input.name}.items_per_minute`, Math.round(numberOfItemsCorrect / (timeSpent / 60)))
      } else if (input && typeof input.value === 'string') {
        set(input, `${firstIdSegment}${input.name}`, input.value)
      } else if (input && typeof input.value === 'number') {
        set(input, `${firstIdSegment}${input.name}`, input.value)
      } else if (input && Array.isArray(input.value)) {
        for (let group of input.value) {
          set(input, `${firstIdSegment}${input.name}.${group.name}`, group.value)
        }
      } else if ((input && typeof input.value === 'object') && (input && !Array.isArray(input.value)) && (input && input.value !== null)) {
        let elementKeys = Object.keys(input.value);
        for (let key of elementKeys) {
          set(input, `${firstIdSegment}${input.name}.${key}`, input.value[key])
        };
      }
    }
  }
  let data = await tangyModules.hook("flatFormResponse", {flatFormResponse, formResponse});
  return data.flatFormResponse;
};

String.prototype.rjust = function( width, padding ) {
  padding = padding || " ";
  padding = padding.substr( 0, 1 );
  if( this.length < width )
    return padding.repeat( width - this.length ) + this;
  else
    return this;
}

function pushResponse(doc, db) {
  return new Promise((resolve, reject) => {
    db.get(doc._id)
      .then(oldDoc => {
        // Overrite the _rev property with the _rev in the db and save again.
        const updatedDoc = Object.assign({}, doc, { _rev: oldDoc._rev });
        db.put(updatedDoc)
          .then(_ => resolve(true))
          .catch(error => reject(`synapse pushResponse could not overwrite ${doc._id} to ${db.name} because Error of ${JSON.stringify(error)}`))
      })
      .catch(error => {
        // delete the _rev property from the doc
        delete doc._rev
        db.put(doc)
          .then(_ => resolve(true))
          .catch(error => reject(`synapse pushResponse could not save ${doc._id} to ${db.name} because Error of ${JSON.stringify(error)}`))
    });
  })
}

async function saveData(doc, flatResponse, sourceDb, resolve) {
  // Process the flatResponse
  const synapseDb = new DB(`${sourceDb.name}-synapse`);
  let processedResult = flatResponse

  await pushResponse({
    type: doc.type,
    _id: processedResult._id,
    formId: processedResult.formId,
    startUnixtime: processedResult.startUnixtime,
    processedResult
  }, synapseDb);
  resolve('done!')
}

function getLocationByKeys(keys, locationList) {
  let locationKeys = [...keys]
  let currentLevel = locationList.locations[locationKeys.shift()]
  for (let key of locationKeys ) {
    currentLevel = currentLevel.children[key]
  }
  return currentLevel
}

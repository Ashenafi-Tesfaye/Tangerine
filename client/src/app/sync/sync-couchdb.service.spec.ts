import PouchDB from 'pouchdb';
import { UserDatabase } from './../shared/_classes/user-database.class';
import { AppConfig } from './../shared/_classes/app-config.class';
import { SYNC_DOCS } from './sync.docs';
import { DEFAULT_USER_DOCS } from './../shared/_tokens/default-user-docs.token';
import { AppConfigService } from 'src/app/shared/_services/app-config.service';
import { FormInfo, CouchdbSyncSettings, CustomSyncSettings } from './../tangy-forms/classes/form-info.class';
import { TestBed, inject } from '@angular/core/testing';

import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { UserService } from 'src/app/shared/_services/user.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { UserSignup } from 'src/app/shared/_classes/user-signup.class';

/* @TODO
import { SyncCouchdbService, LocationQuery, SyncDetails } from './sync-couchdb.service';


const TEST_USERNAME = 'test-user'

const TEST_FORM_ID_1 = 'TEST_FORM_ID_1'
const TEST_FORM_ID_2 = 'TEST_FORM_ID_2'
const TEST_FORM_ID_3 = 'TEST_FORM_ID_3'

const MOCK_GROUP_ID = 'MOCK_GROUP_ID'
const MOCK_DEVICE_ID = 'MOCK_DEVICE_ID'
const MOCK_DEVICE_TOKEN = 'MOCK_DEVICE_TOKEN'
const MOCK_SERVER_URL = 'MOCK_SERVER_URL'

const MOCK_REMOTE_DB_CONNECT_STRING = 'MOCK_REMOTE_DB_CONNECT_STRING' 

const MOCK_APP_CONFIG = <AppConfig>{
  sharedUserDatabase: false
}

class MockAppConfigService {
  getAppConfig():Promise<AppConfig> {
    return new Promise((resolve, reject) => {
      resolve(MOCK_APP_CONFIG)
    })
  }
}

describe('SyncCouchdbService', () => {

  let httpClient: HttpClient
  let httpTestingController: HttpTestingController
  let userService: UserService
  let syncCouchdbService: SyncCouchdbService 
  let userDb: UserDatabase

  beforeEach(async() => { 
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
      {provide: AppConfigService, useClass: MockAppConfigService},
       {
          provide: DEFAULT_USER_DOCS,
          useValue: SYNC_DOCS,
          multi: true
        },
        UserService,
        SyncCouchdbService 
 
      ]
    })
    // Get fresh injected instances.
    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    userService = TestBed.get(UserService);
    syncCouchdbService = TestBed.get(SyncCouchdbService)
    // Initialize to install docs.
    await userService.initialize()
    await userService.install()
    // Create the user.
    await userService.create(<UserSignup>{
      username: TEST_USERNAME,
      password: 'password',
      securityQuestionResponse: '...'
    })
    userDb = await userService.getUserDatabase(TEST_USERNAME)
  })

  afterEach(async () => {
    await userService.uninstall()
    const mockRemoteDb = new PouchDB(MOCK_REMOTE_DB_CONNECT_STRING)
    await mockRemoteDb.destroy()
  })

  it('should be created', () => {
    expect(!!syncCouchdbService).toEqual(true);
  })

  it('should couchdb sync and then have a reduced queue', async(done) => {
    const mockRemoteDb = new PouchDB(MOCK_REMOTE_DB_CONNECT_STRING)
    const FORM_INFOS = [
      <FormInfo>{
        id: TEST_FORM_ID_1,
        customSyncSettings: {
          enabled: true,
          push: true,
          pull: false,
          excludeIncomplete: false 
        },
        couchdbSyncSettings: <CouchdbSyncSettings>{
          enabled: false,
          filterByLocation: false
        }
      },
      <FormInfo>{
        id: TEST_FORM_ID_2,
        customSyncSettings: {
          enabled: false,
          push: false,
          pull: false,
          excludeIncomplete: false 
        },
        couchdbSyncSettings: <CouchdbSyncSettings>{
          enabled: true,
          filterByLocation: false 
        }
      }
    ]
    const TEST_DOC_1 = {
      _id: '1',
      collection: 'TangyFormResponse',
      form: {
        id: TEST_FORM_ID_1
      },
      items: [],
      complete: false
    }
    const TEST_DOC_2 = {
      _id: '2',
      collection: 'TangyFormResponse',
      form: {
        id: TEST_FORM_ID_2
      },
      items: [],
      complete: false
    }
    await userDb.post(TEST_DOC_1)
    await userDb.post(TEST_DOC_2)
    expect((await syncCouchdbService.uploadQueue(userDb, FORM_INFOS)).includes(TEST_DOC_2._id)).toEqual(true)
    expect((await syncCouchdbService.uploadQueue(userDb, FORM_INFOS)).length).toEqual(1)
    syncCouchdbService.sync(userDb, <SyncDetails>{ 
      serverUrl: MOCK_SERVER_URL,
      groupId: MOCK_GROUP_ID,
      deviceId: MOCK_DEVICE_ID,
      deviceToken: MOCK_DEVICE_TOKEN,
      formInfos: FORM_INFOS,
      locationQueries: []
    }).then(async() => {
      expect((await syncCouchdbService.uploadQueue(userDb, FORM_INFOS)).includes(TEST_DOC_2._id)).toEqual(false)
      expect((await syncCouchdbService.uploadQueue(userDb, FORM_INFOS)).length).toEqual(0)
      expect((await mockRemoteDb.allDocs()).rows.length).toEqual(1)
      done()
    })
    setTimeout(() => {
      const req = httpTestingController.expectOne(`${MOCK_SERVER_URL}sync-session/start/${MOCK_GROUP_ID}/${MOCK_DEVICE_ID}/${MOCK_DEVICE_TOKEN}`);
      expect(req.request.method).toEqual('GET')
      req.flush(MOCK_REMOTE_DB_CONNECT_STRING);
    }, 500)
  }, 2000)

  it('should sync but with conflicts', async (done) => {
    // Set up form infos and a mock remote database to sync with.
    const FORM_INFOS = [
      <FormInfo>{
        id: TEST_FORM_ID_1,
        customSyncSettings: {
          enabled: false,
          push: false,
          pull: false,
          excludeIncomplete: false 
        },
        couchdbSyncSettings: <CouchdbSyncSettings>{
          enabled: true,
          filterByLocation: false
        }
      }
    ]
    const mockRemoteDb = new PouchDB(MOCK_REMOTE_DB_CONNECT_STRING)
    // Prepopulate the a doc then send to remote.
    await userDb.put({_id:"doc1", collection: 'TangyFormResponse', form: {id: TEST_FORM_ID_1}, items: [], complete: true})
    await mockRemoteDb.sync(userDb.db)
    // Get and edit the doc in both places to make a conflict.
    const localDoc1 = await userDb.get('doc1')
    await userDb.put({...localDoc1, foo: 'local change'})
    const remoteDoc1 = await mockRemoteDb.get('doc1')
    await mockRemoteDb.put({...remoteDoc1, foo: 'remote change'})
    // Sync.
    syncCouchdbService.sync(userDb, <SyncDetails>{ 
      serverUrl: MOCK_SERVER_URL,
      groupId: MOCK_GROUP_ID,
      deviceId: MOCK_DEVICE_ID,
      deviceToken: MOCK_DEVICE_TOKEN,
      formInfos: FORM_INFOS,
      locationQueries: []
    }).then(async status => {
      expect(status.pulled).toBe(1)
      expect(status.conflicts.length).toBe(1)
      done()
    })
    setTimeout(() => {
      const req = httpTestingController.expectOne(`${MOCK_SERVER_URL}sync-session/start/${MOCK_GROUP_ID}/${MOCK_DEVICE_ID}/${MOCK_DEVICE_TOKEN}`);
      expect(req.request.method).toEqual('GET')
      req.flush(MOCK_REMOTE_DB_CONNECT_STRING);
    }, 500)
  })

  it('should automatically resolve merge conflict')

  it('should sync by location', async (done) => {
    // Set up form infos and a mock remote database to sync with.
    const FORM_INFOS = [
      // A FormInfo where we use couchdb sync and filter by location.
      <FormInfo>{
        id: TEST_FORM_ID_1,
        customSyncSettings: <CustomSyncSettings>{
          enabled: false,
          push: false,
          pull: false,
          excludeIncomplete: false 
        },
        couchdbSyncSettings: <CouchdbSyncSettings>{
          enabled: true,
          filterByLocation: true 
        }
      },
      // A FormInfo where we use couchdb sync and do not filter by location.
      <FormInfo>{
        id: TEST_FORM_ID_2,
        customSyncSettings: <CustomSyncSettings>{
          enabled: false,
          push: false,
          pull: false,
          excludeIncomplete: false 
        },
        couchdbSyncSettings: <CouchdbSyncSettings>{
          enabled: true,
          filterByLocation: false 
        }
      },
      // A FormInfo where we use don't use couchdb replication.
      <FormInfo>{
        id: TEST_FORM_ID_3,
        customSyncSettings: <CustomSyncSettings>{
          enabled: true,
          push: true,
          pull: false,
          excludeIncomplete: false 
        },
        couchdbSyncSettings: <CouchdbSyncSettings>{
          enabled: false,
          filterByLocation: false 
        }
      }
    ]
    const LOCATION_LEVEL_1 = 'county'
    const LOCATION_LEVEL_2 = 'city'
    const LOCATION_1 = {
      [LOCATION_LEVEL_1]: 'county1',
      [LOCATION_LEVEL_2]: 'city1'
    }
    const LOCATION_2 = {
      [LOCATION_LEVEL_1]: 'county2',
      [LOCATION_LEVEL_2]: 'city2'
    }
    // Tie location query to LOCATION_1's second level.
    const MOCK_LOCATION_QUERY = <LocationQuery>{ 
      level: LOCATION_LEVEL_1,
      id: LOCATION_1[LOCATION_LEVEL_1]
    }
    const mockRemoteDb = new PouchDB(MOCK_REMOTE_DB_CONNECT_STRING)
    //window['userDb'] = userDb
    //window['mockRemoteDb'] = mockRemoteDb
    // This syncs because it belongs to a FormInfo configured to filterByLocation and the location will match the location query.
    await mockRemoteDb.put({
      _id:"doc1", 
      location: LOCATION_1,
      collection: 'TangyFormResponse',
      form: {id: TEST_FORM_ID_1},
      items: [],
      complete: true
    })
    // This syncs because it belongs to a FormInfo configured to couchdb sync but ignore the location query.
    await mockRemoteDb.put({
      _id:"doc2", 
      location: LOCATION_2,
      collection: 'TangyFormResponse',
      form: {id: TEST_FORM_ID_2},
      items: [],
      complete: true
    })
    // This WILL NOT sync because it belongs to a FormInfo configured to filterByID and the location DOES NOT match the mock query.
    await mockRemoteDb.put({
      _id:"doc3", 
      location: LOCATION_2,
      collection: 'TangyFormResponse',
      form: {id: TEST_FORM_ID_1},
      items: [],
      complete: true
    })
    // This WILL NOT sync because it belongs to a FormInfo that does not have couchdb sync enabled.
    await mockRemoteDb.put({
      _id:"doc4", 
      location: LOCATION_1,
      collection: 'TangyFormResponse',
      form: {id: TEST_FORM_ID_3},
      items: [],
      complete: true
    })
    // Sync.
    syncCouchdbService.sync(userDb, <SyncDetails>{ 
      serverUrl: MOCK_SERVER_URL,
      groupId: MOCK_GROUP_ID,
      deviceId: MOCK_DEVICE_ID,
      deviceToken: MOCK_DEVICE_TOKEN,
      formInfos: FORM_INFOS,
      locationQueries: [MOCK_LOCATION_QUERY]
    }).then(async status => {
      expect(status.pulled).toBe(2)
      const doc1 = await userDb.get('doc1')
      expect(doc1).toBeTruthy()
      const doc2 = await userDb.get('doc2')
      expect(doc2).toBeTruthy()
      try {
        const doc3 = await userDb.get('doc3')
        expect(doc3).toBeFalsy()
      } catch (e) {
        // All good.
      }
      try {
        const doc4 = await userDb.get('doc4')
        expect(doc4).toBeFalsy()
      } catch (e) {
        // All good.
      }
      done()
    })
    setTimeout(() => {
      const req = httpTestingController.expectOne(`${MOCK_SERVER_URL}sync-session/start/${MOCK_GROUP_ID}/${MOCK_DEVICE_ID}/${MOCK_DEVICE_TOKEN}`);
      expect(req.request.method).toEqual('GET')
      req.flush(MOCK_REMOTE_DB_CONNECT_STRING);
    }, 500)
  }, 4000)

  it('should not count remotely created docs synced down as needing sync (missing .tangerineSyncedOn, no need some kind of flag for neverSynced that client can use. This just affects the count of how many docs need syncing, wouldnt actually cause a sync.)...')
  it('should push everything because maybe we changed location of device and there is some info tied to the old location? Or maybe changing location is a database clear kind of thing.')
});

*/
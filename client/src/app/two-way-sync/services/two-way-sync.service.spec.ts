import { TestBed } from '@angular/core/testing';

import PouchDB from 'pouchdb';

import { TwoWaySyncService } from './two-way-sync.service';
import { AppConfig } from 'src/app/shared/_classes/app-config.class';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { UserService } from 'src/app/shared/_services/user.service';
import { TwoWaySyncModule } from '../two-way-sync.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { TangyFormsModule } from 'src/app/tangy-forms/tangy-forms.module';
import { AppConfigService } from 'src/app/shared/_services/app-config.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SyncingService } from 'src/app/core/sync-records/_services/syncing.service';
import { TangyFormService } from 'src/app/tangy-forms/tangy-form-service';

const MOCK_REMOTE_DOC_IDS = [
  'doc1',
  'doc2'
]

const MOCK_REMOTE_DB_INFO_1 = 'MOCK_REMOTE_DB_INFO_1'
const MOCK_LOCAL_DB_INFO_1 = 'MOCK_LOCAL_DB_INFO_1'
const MOCK_REMOTE_DB_INFO_2 = 'MOCK_REMOTE_DB_INFO_2'
const MOCK_LOCAL_DB_INFO_2 = 'MOCK_LOCAL_DB_INFO_2'

const MOCK_SERVER_URL = 'http://localhost/'

class MockTangyFormService {
  async getFormsInfo() {
    return [
      {id: 'example1', src: './example1/form.json', title: 'Example 1'},
      {id: 'example2', src: './example2/form.json', title: 'Example 2'},
    ]
  }
}

class MockAppConfigService {
  getAppConfig():Promise<AppConfig> {
    return new Promise((resolve, reject) => {
      resolve(<AppConfig>{
        serverUrl: MOCK_SERVER_URL,
        groupName: 'foo'
      })
    })
  }
}

class MockSyncService {
  async sync() {
    return true
  }
  async getUploadQueue() {
    return [1, 2]
  }
}

class MockUserService {
  async getUserProfile(username:string) {
    return { _id: 'ABC123' }
  }
}

describe('TwoWaySyncService', () => {

  let httpClient: HttpClient
  let httpTestingController: HttpTestingController
  let userService: UserService
  let twoWaySyncService: TwoWaySyncService

  beforeEach(async() => { 
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        SharedModule,
        TwoWaySyncModule
      ],
      providers: [
        {provide: AppConfigService, useClass: MockAppConfigService},
        {provide: SyncingService, useClass: MockSyncService},
        {provide: TangyFormService, useClass: MockTangyFormService}
      ]
    })
    // Get fresh injected instances.
    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    userService = TestBed.get(UserService);
    twoWaySyncService = TestBed.get(TwoWaySyncService)
  })

  it('should be created', () => {
    const service: TwoWaySyncService = TestBed.get(TwoWaySyncService);
    expect(service).toBeTruthy();
  });

  it('should sync', async function(done) {
    const mockRemoteDb = new PouchDB(MOCK_REMOTE_DB_INFO_1)
    await mockRemoteDb.put({
      _id: '_design/sync_filter-by-form-ids',
      filters: {
        "sync_filter-by-form-ids": function (doc, req) {
          var formIds = req.query.formIds.split(',')
          return doc.collection === 'TangyFormResponse' &&
            doc.form &&
            doc.form.id &&
            formIds.includes(doc.form.id)
        }.toString()
      }
    })
    const userAccount = await userService.create({
      username: MOCK_LOCAL_DB_INFO_1,
      securityQuestionResponse: '123',
      password: '123'
    })
    // User's profile which should always get pulled down. But counted?
    await mockRemoteDb.put({_id:userAccount.userUUID, collection: 'TangyFormResponse', form: {id: "user-profile"}, someChangeOnServer: true})
    // Remote docs that should get pulled down.
    await mockRemoteDb.put({_id:"doc1", collection: 'TangyFormResponse', form: {id: "example1"}})
    await mockRemoteDb.put({_id:"doc2", collection: 'TangyFormResponse', form: {id: "example1"}})
    // Remote doc that won't get pulled down.
    await mockRemoteDb.put({_id:"doc3", collection: 'TangyFormResponse', form: {id: "example2"}})
    await mockRemoteDb.put({_id:"doc4", collection: 'TangyFormResponse', form: {id: "example2"}})
    const mockLocalDb = new PouchDB(MOCK_LOCAL_DB_INFO_1)
    // Local doc that should two-way replicate up.
    await mockLocalDb.put({_id:"doc5", collection: 'TangyFormResponse', form: {id: "example1"}})
    await mockLocalDb.put({_id:"doc6", collection: 'TangyFormResponse', form: {id: "example1"}})
    // Never uploaded doc that will get pushed up.
    await mockLocalDb.put({_id:"doc7", collection: 'TangyFormResponse', form: {id: "example2"}, lastModified: 1})
    // Has been uploaded but has been modified since.
    await mockLocalDb.put({_id:"doc9", collection: 'TangyFormResponse', form: {id: "example2"}, uploadDate: 2, lastModified: 3})
    // Has been uploaded but has not been modified since.
    await mockLocalDb.put({_id:"doc8", collection: 'TangyFormResponse', form: {id: "example2"}, uploadDate: 2, lastModified: 1})
    twoWaySyncService.sync(MOCK_LOCAL_DB_INFO_1).then(async status => {
      const userDoc = mockLocalDb.get(userAccount.userUUID)
      await userService.remove(MOCK_LOCAL_DB_INFO_1)
      await mockRemoteDb.destroy()
      expect(status.pulled).toBe(2)
      expect(status.pushed).toBe(2)
      expect(status.conflicts.length).toBe(0)
      // @TODO
      //expect(userDoc.someChangeOnServer).toBeTruthy
      done()
    })
    setTimeout(() => {
      const req = httpTestingController.expectOne(`${MOCK_SERVER_URL}sync-session/start/foo/${userAccount.userUUID}`);
      expect(req.request.method).toEqual('GET')
      req.flush({
        url: MOCK_REMOTE_DB_INFO_1,
        filter: 'sync_filter-by-form-ids',
        query_params: { formIds:'example1' }
      });
    }, 1000)
  }, 4000)

  it('should sync but with conflicts', async (done) => {
    const mockRemoteDb = new PouchDB(MOCK_REMOTE_DB_INFO_2)
    await mockRemoteDb.put({
      _id: '_design/sync_filter-by-form-ids',
      filters: {
        "sync_filter-by-form-ids": function (doc, req) {
          var formIds = req.query.formIds.split(',')
          return doc.collection === 'TangyFormResponse' &&
            doc.form &&
            doc.form.id &&
            formIds.includes(doc.form.id)
        }.toString()
      }
    })
    const userAccount = await userService.create({
      username: MOCK_LOCAL_DB_INFO_2,
      securityQuestionResponse: '123',
      password: '123'
    })
    // Prepopulate the mock remote db.
    await mockRemoteDb.put({_id:"doc1", collection: 'TangyFormResponse', form: {id: "example1"}})
    await mockRemoteDb.put({_id:"doc2", collection: 'TangyFormResponse', form: {id: "example1"}})
    const mockLocalDb = userService.getUserDatabase(MOCK_LOCAL_DB_INFO_2)
    await mockLocalDb.put({_id:"doc3", collection: 'TangyFormResponse', form: {id: "example1"}})
    await mockLocalDb.put({_id:"doc4", collection: 'TangyFormResponse', form: {id: "example1"}})
    await mockRemoteDb.sync(mockLocalDb)
    const localDoc1 = await mockLocalDb.get('doc1')
    const remoteDoc1 = await mockRemoteDb.get('doc1')
    await mockLocalDb.put({...localDoc1, foo: 'local change'})
    await mockRemoteDb.put({...remoteDoc1, foo: 'remote change'})
    twoWaySyncService.sync(MOCK_LOCAL_DB_INFO_2).then(async status => {
      await userService.remove(MOCK_LOCAL_DB_INFO_2)
      await mockRemoteDb.destroy()
      expect(status.pulled).toBe(1)
      expect(status.conflicts.length).toBe(1)
      done()
    })
    setTimeout(() => {
      const req = httpTestingController.expectOne(`${MOCK_SERVER_URL}sync-session/start/foo/${userAccount.userUUID}`);
      expect(req.request.method).toEqual('GET');
      req.flush({
        url: MOCK_REMOTE_DB_INFO_2,
        filter: 'sync_filter-by-form-ids',
        query_params: { formIds:'example1' }
      });
    }, 1000)
  }, 4000)

});
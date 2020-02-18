// @ts-ignore
import PouchDB from 'pouchdb';
// @ts-ignore
import PouchDBFind from 'pouchdb-find';
import * as cordovaSqlitePlugin from 'pouchdb-adapter-cordova-sqlite';
import * as PouchDBUpsert from 'pouchdb-upsert';
import {_TRANSLATE} from '../translation-marker';
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);
PouchDB.plugin(cordovaSqlitePlugin);
PouchDB.defaults({auto_compaction: true, revs_limit: 1});

export function DB(name, key = ''):PouchDB {
  let options = <any>{};
  if (window['isCordovaApp']) {
    options = {
      adapter: 'cordova-sqlite',
      location: 'default',
      androidDatabaseImplementation: 2
    };
    if (key) {
      window['sqlitePlugin'].openDatabase({name, key, location: 'default', androidDatabaseImplementation: 2});
      options.key = key
    } else {
      window['sqlitePlugin'].openDatabase({name, location: 'default', androidDatabaseImplementation: 2});
    }
  }
  return new PouchDB(name, options);
}

import Collection from 'marsdb';
import LocalForageStorage from 'marsdb-localforage';

Collection.defaultStorageManager(LocalForageStorage);

export default Collection;

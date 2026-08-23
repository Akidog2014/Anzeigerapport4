"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG 7.0
 * STORAGE.JS
 * =========================================================
 *
 * Personendaten werden ausschließlich verschlüsselt
 * in IndexedDB gespeichert.
 *
 * Der Service Worker sieht diese Daten nicht.
 *
 * =========================================================
 */


const DATA_DB_NAME =
    "PersonenerfassungDataDB";

const DATA_DB_VERSION =
    1;

const DATA_STORE =
    "encryptedData";

const DATA_ID =
    "current";


/* =========================================================
   DATENBANK ÖFFNEN
========================================================= */

function openDataDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    DATA_DB_NAME,
                    DATA_DB_VERSION
                );

            request.onupgradeneeded =
                () => {

                    const db =
                        request.result;

                    if (
                        !db.objectStoreNames.contains(
                            DATA_STORE
                        )
                    ) {

                        db.createObjectStore(
                            DATA_STORE
                        );

                    }

                };

            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };

            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


/* =========================================================
   VERSCHLÜSSELTEN DATENSATZ SPEICHERN
========================================================= */

async function speichereVerschluesselteDaten(
    personenDaten
) {

    const daten = {

        version:
            "7.0",

        gespeichert:
            new Date().toISOString(),

        personen:
            personenDaten

    };


    const json =
        JSON.stringify(
            daten
        );


    const encrypted =
        await verschluesselnLokal(
            json
        );


    const db =
        await openDataDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    DATA_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    DATA_STORE
                );

            const request =
                store.put(
                    encrypted,
                    DATA_ID
                );

            request.onsuccess =
                () => {

                    resolve(
                        encrypted
                    );

                };

            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


/* =========================================================
   VERSCHLÜSSELTEN DATENSATZ LADEN
========================================================= */

async function ladeVerschluesselteDaten() {

    const db =
        await openDataDatabase();


    const encrypted =
        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        DATA_STORE,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        DATA_STORE
                    );

                const request =
                    store.get(
                        DATA_ID
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            request.result ||
                            null
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );


    if (!encrypted) {

        return null;

    }


    const text =
        await entschluesselnLokal(
            encrypted
        );


    const daten =
        JSON.parse(
            text
        );


    if (
        !daten ||
        !Array.isArray(
            daten.personen
        )
    ) {

        throw new Error(
            "Ungültige Datenstruktur."
        );

    }


    return daten;

}


/* =========================================================
   DATEN LÖSCHEN
========================================================= */

async function loescheAlleDaten() {

    const db =
        await openDataDatabase();


    await new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    DATA_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    DATA_STORE
                );

            const request =
                store.delete(
                    DATA_ID
                );

            request.onsuccess =
                () => {

                    resolve();

                };

            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );


    /*
     * Auch den Geräteschlüssel löschen.
     */

    const keyDb =
        await openCryptoDatabase();


    await new Promise(
        (resolve, reject) => {

            const transaction =
                keyDb.transaction(
                    LOCAL_KEY_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    LOCAL_KEY_STORE
                );

            const request =
                store.delete(
                    LOCAL_KEY_ID
                );

            request.onsuccess =
                () => {

                    resolve();

                };

            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


/* =========================================================
   BACKUP-DATEN ERSTELLEN
========================================================= */

async function backupDatenErstellen() {

    const daten =
        await ladeVerschluesselteDaten();


    if (!daten) {

        throw new Error(
            "Es sind keine Daten vorhanden."
        );

    }


    return daten;

}

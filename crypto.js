"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG 7.0
 * CRYPTO.JS
 * =========================================================
 *
 * Lokale Daten:
 *
 * AES-256-GCM
 *
 * Der Geräteschlüssel wird als nicht exportierbarer
 * CryptoKey erzeugt.
 *
 * Zusätzlich können Backups mit einem separaten
 * Passwort verschlüsselt werden.
 *
 * =========================================================
 */


const CRYPTO_VERSION = 7;

const LOCAL_KEY_DB =
    "PersonenerfassungCryptoDB";

const LOCAL_KEY_STORE =
    "keys";

const LOCAL_KEY_ID =
    "device-key";


/* =========================================================
   TEXT
========================================================= */

function cryptoTextEncoder() {

    return new TextEncoder();

}


function cryptoTextDecoder() {

    return new TextDecoder();

}


/* =========================================================
   BASE64
========================================================= */

function bytesToBase64(bytes) {

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        const chunk =
            bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            );

        binary += String.fromCharCode(
            ...chunk
        );

    }

    return btoa(binary);

}


function base64ToBytes(base64) {

    if (
        typeof base64 !== "string"
    ) {

        throw new Error(
            "Ungültige Base64-Daten."
        );

    }

    const binary =
        atob(base64);

    const result =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        result[i] =
            binary.charCodeAt(i);

    }

    return result;

}


/* =========================================================
   INDEXEDDB FÜR SCHLÜSSEL
========================================================= */

function openCryptoDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    LOCAL_KEY_DB,
                    1
                );

            request.onupgradeneeded =
                () => {

                    const db =
                        request.result;

                    if (
                        !db.objectStoreNames.contains(
                            LOCAL_KEY_STORE
                        )
                    ) {

                        db.createObjectStore(
                            LOCAL_KEY_STORE
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
   SCHLÜSSEL LADEN
========================================================= */

async function ladeGeraeteSchluessel() {

    const db =
        await openCryptoDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    LOCAL_KEY_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    LOCAL_KEY_STORE
                );

            const request =
                store.get(
                    LOCAL_KEY_ID
                );

            request.onsuccess =
                () => {

                    resolve(
                        request.result || null
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
   SCHLÜSSEL SPEICHERN
========================================================= */

async function speichereGeraeteSchluessel(
    key
) {

    const db =
        await openCryptoDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    LOCAL_KEY_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    LOCAL_KEY_STORE
                );

            const request =
                store.put(
                    key,
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
   NEUEN GERÄTESCHLÜSSEL ERSTELLEN
========================================================= */

async function erstelleGeraeteSchluessel() {

    const key =
        await crypto.subtle.generateKey(

            {
                name: "AES-GCM",

                length: 256
            },

            false,

            [
                "encrypt",
                "decrypt"
            ]

        );

    await speichereGeraeteSchluessel(
        key
    );

    return key;

}


/* =========================================================
   GERÄTESCHLÜSSEL SICHERSTELLEN
========================================================= */

async function holeGeraeteSchluessel() {

    let key =
        await ladeGeraeteSchluessel();

    if (key) {

        return key;

    }

    return erstelleGeraeteSchluessel();

}


/* =========================================================
   LOKALE VERSCHLÜSSELUNG
========================================================= */

async function verschluesselnLokal(
    text
) {

    const key =
        await holeGeraeteSchluessel();

    const iv =
        crypto.getRandomValues(
            new Uint8Array(12)
        );

    const plaintext =
        cryptoTextEncoder()
            .encode(text);

    const ciphertext =
        await crypto.subtle.encrypt(

            {
                name: "AES-GCM",

                iv: iv
            },

            key,

            plaintext

        );

    return {

        version:
            CRYPTO_VERSION,

        algorithm:
            "AES-256-GCM",

        created:
            new Date().toISOString(),

        iv:
            bytesToBase64(iv),

        data:
            bytesToBase64(
                new Uint8Array(
                    ciphertext
                )
            )

    };

}


/* =========================================================
   LOKALE ENTSCHLÜSSELUNG
========================================================= */

async function entschluesselnLokal(
    obj
) {

    if (
        !obj ||
        obj.algorithm !==
            "AES-256-GCM"
    ) {

        throw new Error(
            "Ungültiges Verschlüsselungsformat."
        );

    }

    const key =
        await holeGeraeteSchluessel();

    const iv =
        base64ToBytes(
            obj.iv
        );

    const data =
        base64ToBytes(
            obj.data
        );

    const decrypted =
        await crypto.subtle.decrypt(

            {
                name: "AES-GCM",

                iv: iv
            },

            key,

            data

        );

    return cryptoTextDecoder()
        .decode(decrypted);

}


/* =========================================================
   PASSWORT → BACKUP-SCHLÜSSEL
========================================================= */

const BACKUP_PBKDF2_ITERATIONS =
    600000;


async function backupPasswortKey(
    password,
    salt
) {

    const baseKey =
        await crypto.subtle.importKey(

            "raw",

            cryptoTextEncoder()
                .encode(password),

            {
                name: "PBKDF2"
            },

            false,

            [
                "deriveKey"
            ]

        );


    return crypto.subtle.deriveKey(

        {

            name: "PBKDF2",

            salt: salt,

            iterations:
                BACKUP_PBKDF2_ITERATIONS,

            hash:
                "SHA-256"

        },

        baseKey,

        {

            name: "AES-GCM",

            length: 256

        },

        false,

        [
            "encrypt",
            "decrypt"
        ]

    );

}


/* =========================================================
   BACKUP VERSCHLÜSSELN
========================================================= */

async function verschluesselnBackup(
    text,
    password
) {

    if (
        !password ||
        password.length < 12
    ) {

        throw new Error(
            "Das Backup-Passwort muss mindestens " +
            "12 Zeichen lang sein."
        );

    }

    const salt =
        crypto.getRandomValues(
            new Uint8Array(16)
        );

    const iv =
        crypto.getRandomValues(
            new Uint8Array(12)
        );

    const key =
        await backupPasswortKey(
            password,
            salt
        );

    const encrypted =
        await crypto.subtle.encrypt(

            {
                name: "AES-GCM",

                iv: iv

            },

            key,

            cryptoTextEncoder()
                .encode(text)

        );

    return {

        version:
            CRYPTO_VERSION,

        type:
            "personenerfassung-backup",

        algorithm:
            "AES-256-GCM",

        kdf:
            "PBKDF2-SHA-256",

        iterations:
            BACKUP_PBKDF2_ITERATIONS,

        created:
            new Date().toISOString(),

        salt:
            bytesToBase64(
                salt
            ),

        iv:
            bytesToBase64(
                iv
            ),

        data:
            bytesToBase64(
                new Uint8Array(
                    encrypted
                )
            )

    };

}


/* =========================================================
   BACKUP ENTSCHLÜSSELN
========================================================= */

async function entschluesselnBackup(
    obj,
    password
) {

    if (
        !obj ||
        obj.type !==
            "personenerfassung-backup"
    ) {

        throw new Error(
            "Ungültige Backup-Datei."
        );

    }

    if (
        obj.algorithm !==
            "AES-256-GCM"
    ) {

        throw new Error(
            "Unbekannter Verschlüsselungsalgorithmus."
        );

    }

    if (
        obj.kdf !==
            "PBKDF2-SHA-256"
    ) {

        throw new Error(
            "Unbekannte Schlüsselableitung."
        );

    }

    const salt =
        base64ToBytes(
            obj.salt
        );

    const iv =
        base64ToBytes(
            obj.iv
        );

    const data =
        base64ToBytes(
            obj.data
        );

    const key =
        await backupPasswortKey(
            password,
            salt
        );

    const decrypted =
        await crypto.subtle.decrypt(

            {
                name: "AES-GCM",

                iv: iv

            },

            key,

            data

        );

    return cryptoTextDecoder()
        .decode(decrypted);

}

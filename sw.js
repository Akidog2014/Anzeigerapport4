"use strict";


/*
 * =========================================================
 * PERSONENERFASSUNG V11
 * SERVICE WORKER
 * =========================================================
 *
 * Der Service Worker speichert ausschließlich
 * die Anwendung selbst.
 *
 * PERSONENDATEN WERDEN NICHT DURCH DEN
 * SERVICE WORKER GESPEICHERT.
 *
 * Personendaten befinden sich:
 *
 * 1. während der Bearbeitung im Arbeitsspeicher
 *
 * 2. verschlüsselt in IndexedDB
 *
 * Der Service Worker hat keinen Zugriff auf
 * den Entschlüsselungsschlüssel.
 *
 * =========================================================
 */


const CACHE_NAME =
    "personenerfassung-v11";


const APP_FILES = [

    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    cache => {

                        return cache.addAll(
                            APP_FILES
                        );

                    }
                )

        );


        /*
         * Neue Version sofort aktivieren.
         */

        self.skipWaiting();

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames.map(
                                cacheName => {

                                    if (
                                        cacheName !==
                                        CACHE_NAME
                                    ) {

                                        return caches.delete(
                                            cacheName
                                        );

                                    }

                                    return undefined;

                                }
                            )

                        );

                    }
                )

        );


        self.clients.claim();

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        /*
         * Nur GET behandeln.
         */

        if (
            event.request.method !==
            "GET"
        ) {

            return;

        }


        const url =
            new URL(
                event.request.url
            );


        /*
         * Nur HTTP / HTTPS.
         */

        if (
            url.protocol !==
                "http:" &&
            url.protocol !==
                "https:"
        ) {

            return;

        }


        /*
         * Nur Ressourcen der eigenen Anwendung
         * aus dem Cache bedienen.
         *
         * Fremde Ressourcen werden nicht
         * dauerhaft gecacht.
         */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        event.respondWith(

            caches
                .match(
                    event.request
                )
                .then(
                    cachedResponse => {

                        if (
                            cachedResponse
                        ) {

                            return cachedResponse;

                        }


                        return fetch(
                            event.request
                        )
                        .then(
                            networkResponse => {

                                if (
                                    networkResponse &&
                                    networkResponse.ok
                                ) {

                                    const copy =
                                        networkResponse.clone();


                                    caches
                                        .open(
                                            CACHE_NAME
                                        )
                                        .then(
                                            cache => {

                                                cache.put(
                                                    event.request,
                                                    copy
                                                );

                                            }
                                        );

                                }


                                return networkResponse;

                            }
                        )
                        .catch(
                            () => {

                                return new Response(

                                    "Offline – diese Ressource " +
                                    "ist nicht verfügbar.",

                                    {
                                        status:
                                            503,

                                        headers: {
                                            "Content-Type":
                                                "text/plain; charset=utf-8"
                                        }
                                    }

                                );

                            }
                        );

                    }
                )

        );

    }
);


/* =========================================================
   MESSAGE
========================================================= */

self.addEventListener(
    "message",
    event => {

        if (
            event.data ===
            "SKIP_WAITING"
        ) {

            self.skipWaiting();

        }

    }
);

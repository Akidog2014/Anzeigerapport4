"use strict";


/*
 * =========================================================
 * PERSONENERFASSUNG
 * SERVICE WORKER V11.1
 * =========================================================
 *
 * Der Service Worker cached ausschließlich
 * die Programmdateien.
 *
 * PERSONENDATEN WERDEN NICHT GEcACHED.
 *
 * Die Personendaten befinden sich ausschließlich:
 *
 * 1. während der Bearbeitung im Arbeitsspeicher
 *
 * 2. als AES-256-GCM-verschlüsselter Datensatz
 *    in localStorage
 *
 * =========================================================
 */


const CACHE_NAME =
    "personenerfassung-v11-1";


const APP_FILES = [

    "./",
    "./index.html",
    "./manifest.json"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    cache => {

                        return cache.addAll(
                            APP_FILES
                        );

                    }
                )

        );

        /*
         * Neue Version darf sofort aktiviert werden.
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
         * Nur GET-Anfragen behandeln.
         */

        if (
            event.request.method !== "GET"
        ) {

            return;

        }


        const url =
            new URL(
                event.request.url
            );


        /*
         * Nur HTTP/HTTPS.
         */

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;

        }


        /*
         * Nur eigene Anwendung behandeln.
         *
         * Keine externen Webseiten und
         * keine Mailto-Anfragen werden gecacht.
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

                                /*
                                 * Nur erfolgreiche
                                 * Basic-Antworten cachen.
                                 */

                                if (
                                    networkResponse &&
                                    networkResponse.ok &&
                                    networkResponse.type ===
                                        "basic"
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

                                /*
                                 * Offline und Ressource
                                 * nicht vorhanden.
                                 */

                                return new Response(

                                    "Offline – diese Ressource " +
                                    "ist nicht verfügbar.",

                                    {
                                        status: 503,

                                        headers: {

                                            "Content-Type":
                                                "text/plain; " +
                                                "charset=utf-8"

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

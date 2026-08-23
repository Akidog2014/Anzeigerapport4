"use strict";


/*
 * =========================================================
 * PERSONENERFASSUNG
 * SERVICE WORKER
 * Version 7.0
 * =========================================================
 *
 * Der Service Worker speichert ausschließlich
 * die technischen Dateien der Anwendung.
 *
 * PERSONENDATEN WERDEN NICHT DURCH DEN
 * SERVICE WORKER GESPEICHERT.
 *
 * Die verschlüsselten Personendaten befinden sich
 * ausschließlich im localStorage der Anwendung.
 *
 * =========================================================
 */


const CACHE_NAME =
    "personenerfassung-v7-0";


const APP_FILES = [

    "./",
    "./index.html",
    "./manifest.json",
    "./sw.js"

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
         * Neue Version darf sofort übernehmen.
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
         * Nur die eigene Anwendung
         * aus dem Cache bedienen.
         *
         * Externe Ressourcen werden nicht
         * dauerhaft durch diese Anwendung
         * gespeichert.
         */
        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        event.respondWith(

            caches
                .match(event.request)
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
                                 * Erfolgreiche Antworten
                                 * der eigenen Anwendung cachen.
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
                                        .open(CACHE_NAME)
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

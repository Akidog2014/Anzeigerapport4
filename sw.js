"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG V11
 * SERVICE WORKER
 * =========================================================
 *
 * Der Service Worker speichert ausschließlich
 * die Programmdateien.
 *
 * PERSONENDATEN WERDEN NICHT GECACHT.
 *
 * Die eigentlichen Personendaten befinden sich:
 *
 * 1. während der Bearbeitung im Arbeitsspeicher
 * 2. verschlüsselt in localStorage
 *
 * Der Geräteschlüssel liegt getrennt davon
 * in IndexedDB.
 *
 * =========================================================
 */

const CACHE_NAME =
    "personenerfassung-v11-0";


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

        if (
            event.request.method !== "GET"
        ) {

            return;

        }

        const url =
            new URL(
                event.request.url
            );


        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;

        }


        /*
         * Nur eigene Anwendung.
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
                            response => {

                                if (
                                    response &&
                                    response.ok
                                ) {

                                    const copy =
                                        response.clone();

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

                                return response;

                            }
                        )
                        .catch(
                            () => {

                                return new Response(

                                    "Offline – diese " +
                                    "Ressource ist nicht " +
                                    "verfügbar.",

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

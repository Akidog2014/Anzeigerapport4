"use strict";


/*
 * =========================================================
 * PERSONENERFASSUNG V8
 * SERVICE WORKER
 * =========================================================
 *
 * WICHTIG:
 *
 * Der Service Worker verarbeitet KEINE Personendaten.
 *
 * Personendaten befinden sich ausschließlich:
 *
 * 1. kurzfristig im Arbeitsspeicher der Anwendung
 *
 * 2. verschlüsselt in IndexedDB
 *
 * Der Service Worker cached ausschließlich
 * statische Dateien der Anwendung.
 *
 * =========================================================
 */


const CACHE_NAME =
    "personenerfassung-v8-0";


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
         * Neue Version darf sofort
         * aktiviert werden.
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
         * Nur HTTP/HTTPS behandeln.
         */

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;

        }


        /*
         * Nur eigene Origin behandeln.
         *
         * Dadurch werden externe Ressourcen
         * nicht in den App-Cache übernommen.
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
                                        status: 503,

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

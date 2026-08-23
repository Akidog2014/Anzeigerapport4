"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG 7.0
 * SERVICE WORKER
 * =========================================================
 */


const CACHE_NAME =
    "personenerfassung-v7-0";


const APP_FILES = [

    "./",
    "./index.html",
    "./app.js",
    "./crypto.js",
    "./storage.js",
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
         * Keine fremden Ursprünge behandeln.
         */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        /*
         * Nur bekannte App-Dateien aus dem
         * Cache bedienen.
         */

        const erlaubteDateien =
            new Set(
                [
                    "/",
                    "/index.html",
                    "/app.js",
                    "/crypto.js",
                    "/storage.js",
                    "/manifest.json"
                ]
            );


        if (
            !erlaubteDateien.has(
                url.pathname
            )
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
                        );

                    }
                )

        );

    }
);

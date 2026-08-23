"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG V12
 * SERVICE WORKER
 * =========================================================
 *
 * WICHTIG:
 *
 * Der Service Worker speichert KEINE Personendaten.
 *
 * Er cached ausschließlich die technischen
 * Bestandteile der PWA:
 *
 *   index.html
 *   manifest.json
 *   Icons
 *
 * Die verschlüsselten Personendaten liegen
 * ausschließlich in IndexedDB.
 *
 * =========================================================
 */

const CACHE_NAME =
    "personenerfassung-v12-0";


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
         * Neue Version darf sofort aktiv werden.
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
         * Nur GET-Anfragen.
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
         * Nur HTTP / HTTPS.
         */

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;

        }


        /*
         * Keine fremden Domains cachen.
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

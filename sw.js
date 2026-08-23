"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG
 * SERVICE WORKER
 * VERSION 11.1
 * =========================================================
 *
 * WICHTIG:
 *
 * Dieser Service Worker speichert KEINE Personendaten.
 *
 * Er cached ausschließlich die Dateien der Anwendung.
 *
 * Die eigentlichen Personendaten liegen verschlüsselt
 * im Browser-Speicher der Anwendung.
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
         * Nur HTTP und HTTPS.
         */

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;
        }


        /*
         * Cache-First:
         *
         * Dadurch funktioniert die PWA
         * auch ohne Internet.
         */

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
                                 * Nur erfolgreiche Antworten
                                 * derselben Origin cachen.
                                 */

                                if (
                                    networkResponse &&
                                    networkResponse.ok &&
                                    networkResponse.type ===
                                        "basic" &&
                                    url.origin ===
                                        self.location.origin
                                ) {

                                    const copy =
                                        networkResponse.clone();

                                    caches
                                        .open(
                                            CACHE_NAME
                                        )
                                        .then(
                                            cache => {

                                                return cache.put(
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

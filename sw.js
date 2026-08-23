"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG V10
 * SERVICE WORKER
 * =========================================================
 *
 * SICHERHEITSPRINZIP:
 *
 * Der Service Worker speichert ausschließlich
 * statische Anwendungsdateien.
 *
 * PERSONENDATEN WERDEN NICHT GECACHT.
 *
 * Die verschlüsselten Personendaten befinden sich
 * ausschließlich im localStorage der Anwendung.
 *
 * Der Service Worker liest weder localStorage
 * noch entschlüsselte Personendaten.
 *
 * =========================================================
 */


const CACHE_NAME =
    "personenerfassung-v10-0";


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
         * Neue Version darf sofort
         * übernommen werden.
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
            event.request.method !== "GET"
        ) {

            return;

        }


        const url =
            new URL(
                event.request.url
            );


        /*
         * Keine Behandlung von nicht-http(s)
         * Ressourcen.
         */

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;

        }


        /*
         * NUR dieselbe Origin.
         *
         * Dadurch werden keine fremden
         * Ressourcen durch diesen Service
         * Worker gecacht.
         */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        /*
         * Niemals dynamische personenbezogene
         * Daten oder API-Antworten speichern.
         *
         * Der Service Worker kennt keine
         * localStorage-Daten.
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
                                 * Nur erfolgreiche
                                 * grundlegende Antworten
                                 * speichern.
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

                                                /*
                                                 * Nur die
                                                 * explizit
                                                 * vorgesehenen
                                                 * App-Dateien
                                                 * werden dauerhaft
                                                 * gecacht.
                                                 */

                                                const path =
                                                    url.pathname;


                                                const erlaubt =
                                                    path.endsWith(
                                                        "/"
                                                    ) ||
                                                    path.endsWith(
                                                        "/index.html"
                                                    ) ||
                                                    path.endsWith(
                                                        "/manifest.json"
                                                    );


                                                if (
                                                    erlaubt
                                                ) {

                                                    cache.put(
                                                        event.request,
                                                        copy
                                                    );

                                                }

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
                                                "charset=utf-8",

                                            "Cache-Control":
                                                "no-store"
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
